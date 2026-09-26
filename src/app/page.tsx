"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import RepoConnector from "@/components/RepoConnector";
import StatsBar from "@/components/StatsBar";
import PRList from "@/components/PRList";
import ScanningOverlay from "@/components/ScanningOverlay";
import { MOCK_PRS, MOCK_REPO, MOCK_RATE_LIMIT } from "@/lib/mockData";
import type {
  ConnectionState,
  ScoredPR,
  PRStats,
  RateLimitInfo,
} from "@/types";

function computeStats(prs: ScoredPR[]): PRStats {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  let totalScore = 0;
  for (const pr of prs) {
    counts[pr.scoring.riskLevel]++;
    totalScore += pr.scoring.totalScore;
  }
  return {
    total: prs.length,
    ...counts,
    averageScore: prs.length > 0 ? Math.round(totalScore / prs.length) : 0,
  };
}

export default function DashboardPage(): React.ReactElement {
  const [connection, setConnection] = useState<ConnectionState>({
    isConnected: false,
    owner: "",
    repo: "",
  });
  const [prs, setPRs] = useState<ScoredPR[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Scanning overlay state — shown while data loads
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"demo" | "live">("demo");
  // pendingData holds the resolved data while overlay is still animating
  const [pendingData, setPendingData] = useState<{
    prs: ScoredPR[];
    rateLimit: RateLimitInfo | null;
    fetchedAt: string | null;
    connection: ConnectionState;
    isDemo: boolean;
  } | null>(null);

  /** Commit pending data to visible state (called after overlay fades out) */
  const commitPending = useCallback(() => {
    setScanning(false);
    if (pendingData) {
      setConnection(pendingData.connection);
      setPRs(pendingData.prs);
      setRateLimit(pendingData.rateLimit);
      setFetchedAt(pendingData.fetchedAt);
      setIsDemo(pendingData.isDemo);
      setPendingData(null);
    }
  }, [pendingData]);

  /** Load demo/simulation data — show scanning animation first */
  const handleDemo = useCallback(() => {
    setError(null);
    setScanMode("demo");
    setScanning(true);
    setPendingData({
      prs: MOCK_PRS,
      rateLimit: MOCK_RATE_LIMIT,
      fetchedAt: new Date().toISOString(),
      connection: {
        isConnected: true,
        owner: MOCK_REPO.owner,
        repo: MOCK_REPO.repo,
        login: MOCK_REPO.login,
      },
      isDemo: true,
    });
  }, []);

  const handleConnect = useCallback(
    async (owner: string, repo: string, pat: string) => {
      setLoading(true);
      setError(null);
      setIsDemo(false);
      setScanMode("live");
      setScanning(true);

      try {
        const connectRes = await fetch("/api/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pat, owner, repo }),
        });
        const connectData = await connectRes.json();

        if (!connectData.success) {
          setScanning(false);
          setError(connectData.error ?? "Connection failed.");
          setLoading(false);
          return;
        }

        const prsRes = await fetch(
          `/api/prs?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
          { headers: { Authorization: `Bearer ${pat}` } }
        );
        const prsData = await prsRes.json();

        if (!prsRes.ok) {
          setScanning(false);
          setError(prsData.error ?? "Failed to fetch PRs.");
        } else {
          // Store in pending — overlay will commit it on finish
          setPendingData({
            prs: prsData.prs ?? [],
            rateLimit: prsData.rateLimit ?? null,
            fetchedAt: prsData.fetchedAt ?? null,
            connection: {
              isConnected: true,
              owner,
              repo,
              login: connectData.login,
              pat,
            },
            isDemo: false,
          });
        }
      } catch {
        setScanning(false);
        setError("Network error. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleRefresh = useCallback(async () => {
    if (isDemo) {
      // Re-load mock with refreshed timestamps
      handleDemo();
      return;
    }
    if (!connection.isConnected || !connection.pat) return;
    await handleConnect(connection.owner, connection.repo, connection.pat);
  }, [connection, handleConnect, handleDemo, isDemo]);

  const handleDisconnect = useCallback(() => {
    setConnection({ isConnected: false, owner: "", repo: "" });
    setPRs([]);
    setError(null);
    setRateLimit(null);
    setFetchedAt(null);
    setIsDemo(false);
  }, []);

  const stats = computeStats(prs);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      <ScanningOverlay
        visible={scanning}
        mode={scanMode}
        onDone={commitPending}
      />
      <Header
        connection={connection}
        rateLimit={rateLimit}
        onRefresh={handleRefresh}
        onDisconnect={handleDisconnect}
        loading={loading}
      />

      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px 100px",
        }}
      >
        {!connection.isConnected ? (
          /* ── Connect screen ── */
          <div
            style={{
              minHeight: "calc(100vh - 56px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <div style={{ width: "100%", maxWidth: 560 }}>
              <RepoConnector onConnect={handleConnect} loading={loading} />

              {/* Demo mode CTA */}
              <div
                style={{
                  maxWidth: 560,
                  marginTop: 32,
                  paddingTop: 24,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 4,
                    }}
                  >
                    No token? Try the demo
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                    6 simulated PRs across all risk levels
                  </p>
                </div>
                <button
                  onClick={handleDemo}
                  style={{
                    padding: "10px 22px",
                    backgroundColor: "transparent",
                    border: "1px solid var(--border2)",
                    color: "var(--text)",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "border-color 0.12s, color 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--text)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border2)";
                  }}
                >
                  Demo →
                </button>
              </div>

              {error && (
                <p
                  role="alert"
                  style={{
                    marginTop: 16,
                    maxWidth: 560,
                    fontSize: "0.84rem",
                    color: "var(--risk-critical-fg)",
                    borderTop: "1px solid var(--border)",
                    paddingTop: 12,
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* ── Dashboard ── */
          <div style={{ paddingTop: 40 }}>
            {/* Demo banner */}
            {isDemo && (
              <div
                role="status"
                style={{
                  marginBottom: 28,
                  padding: "12px 16px",
                  backgroundColor: "var(--surface)",
                  borderLeft: "2px solid var(--border2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: "0.84rem", color: "var(--muted)", fontWeight: 600 }}>
                  Demo mode — simulated data, no GitHub connection required
                </span>
                <button
                  onClick={handleDisconnect}
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    padding: 0,
                    flexShrink: 0,
                    transition: "color 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                  }}
                >
                  Exit demo
                </button>
              </div>
            )}

            {error && (
              <p
                role="alert"
                style={{
                  marginBottom: 20,
                  fontSize: "0.84rem",
                  color: "var(--risk-critical-fg)",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 12,
                }}
              >
                {error}
              </p>
            )}

            <StatsBar stats={stats} fetchedAt={fetchedAt} />
            <PRList prs={prs} loading={loading} />
          </div>
        )}
      </main>
    </div>
  );
}
