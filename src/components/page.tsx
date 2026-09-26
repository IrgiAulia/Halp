"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import RepoConnector from "@/components/RepoConnector";
import StatsBar from "@/components/StatsBar";
import PRList from "@/components/PRList";
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

  /** Load demo/simulation data instantly */
  const handleDemo = useCallback(() => {
    setIsDemo(true);
    setConnection({
      isConnected: true,
      owner: MOCK_REPO.owner,
      repo: MOCK_REPO.repo,
      login: MOCK_REPO.login,
    });
    setPRs(MOCK_PRS);
    setRateLimit(MOCK_RATE_LIMIT);
    setFetchedAt(new Date().toISOString());
    setError(null);
  }, []);

  const handleConnect = useCallback(
    async (owner: string, repo: string, pat: string) => {
      setLoading(true);
      setError(null);
      setIsDemo(false);

      try {
        const connectRes = await fetch("/api/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pat, owner, repo }),
        });
        const connectData = await connectRes.json();

        if (!connectData.success) {
          setError(connectData.error ?? "Connection failed.");
          setLoading(false);
          return;
        }

        setConnection({
          isConnected: true,
          owner,
          repo,
          login: connectData.login,
          pat,
        });

        const prsRes = await fetch(
          `/api/prs?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
          { headers: { Authorization: `Bearer ${pat}` } }
        );
        const prsData = await prsRes.json();

        if (!prsRes.ok) {
          setError(prsData.error ?? "Failed to fetch PRs.");
        } else {
          setPRs(prsData.prs ?? []);
          setRateLimit(prsData.rateLimit ?? null);
          setFetchedAt(prsData.fetchedAt ?? null);
        }
      } catch {
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
      <Header
        connection={connection}
        rateLimit={rateLimit}
        onRefresh={handleRefresh}
        onDisconnect={handleDisconnect}
        loading={loading}
      />

      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        {!connection.isConnected ? (
          /* ── Connect screen ── */
          <div
            style={{
              minHeight: "calc(100vh - 52px)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100%" }}>
              <RepoConnector onConnect={handleConnect} loading={loading} />

              {/* Demo mode CTA */}
              <div
                style={{
                  maxWidth: 440,
                  marginTop: 28,
                  paddingTop: 20,
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
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 2,
                    }}
                  >
                    Try the demo
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    6 simulated PRs across all risk levels
                  </p>
                </div>
                <button
                  onClick={handleDemo}
                  style={{
                    padding: "9px 20px",
                    backgroundColor: "transparent",
                    border: "1px solid var(--line)",
                    color: "var(--text)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Load demo →
                </button>
              </div>

              {error && (
                <p
                  role="alert"
                  style={{
                    marginTop: 16,
                    maxWidth: 440,
                    fontSize: "0.8rem",
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
          <div style={{ paddingTop: 32 }}>
            {/* Demo banner */}
            {isDemo && (
              <div
                role="status"
                style={{
                  marginBottom: 24,
                  padding: "10px 16px",
                  backgroundColor: "var(--surface)",
                  borderLeft: "2px solid var(--text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "var(--text)", fontWeight: 600 }}>
                  Demo mode — simulated data, no GitHub connection required
                </span>
                <button
                  onClick={handleDisconnect}
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  Exit
                </button>
              </div>
            )}

            {error && (
              <p
                role="alert"
                style={{
                  marginBottom: 20,
                  fontSize: "0.8rem",
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
