import type { ConnectionState, RateLimitInfo } from "@/types";

interface HeaderProps {
  connection: ConnectionState;
  rateLimit: RateLimitInfo | null;
  onRefresh: () => void;
  onDisconnect: () => void;
  loading: boolean;
}

/** Halp logo as inline SVG — uses currentColor so it inherits text color */
function HalpLogo({ size = 24 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0, color: "var(--text)" }}
    >
      <path
        d="M327.272 296.497L254.505 371.426L178.736 298.91L252 238.5L327.272 296.497ZM182 182H192V147.844H245V205L176.054 296.342L134.783 256.844V147.844H182V182ZM365.783 256.844L330.251 293.431L255 205V147.844H308V182H318V147.844H365.783V256.844Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Sticky header — Palantir-style dark nav bar.
 * Logo + wordmark tight, then repo info, then right-side controls.
 */
export default function Header({
  connection,
  rateLimit,
  onRefresh,
  onDisconnect,
  loading,
}: HeaderProps): React.ReactElement {
  const rateLimitLow = rateLimit && rateLimit.remaining < 20;

  return (
    <header
      role="banner"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Logo + wordmark — tight gap */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
          <HalpLogo size={22} />

          <span
            style={{
              fontFamily: "var(--font-gabarito), var(--font), sans-serif",
              fontWeight: 900,
              fontSize: "1.05rem",
              letterSpacing: "-0.03em",
              color: "var(--text)",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            Halp
          </span>

          {connection.isConnected && (
            <>
              <span
                style={{
                  color: "var(--border2)",
                  fontSize: "0.85rem",
                  userSelect: "none",
                  marginLeft: 8,
                  marginRight: 2,
                }}
              >
                /
              </span>
              <span
                style={{
                  fontSize: "0.76rem",
                  color: "var(--muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "monospace",
                  letterSpacing: "0.01em",
                }}
              >
                <span className="sr-only">Connected to: </span>
                {connection.owner}/{connection.repo}
                {connection.login && (
                  <span style={{ marginLeft: 8, color: "var(--dim)", fontFamily: "var(--font)" }}>
                    @{connection.login}
                  </span>
                )}
              </span>
            </>
          )}
        </div>

        {/* Right side controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
          {rateLimit && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: rateLimitLow ? "var(--risk-critical-fg)" : "var(--muted)",
                fontFamily: "monospace",
              }}
              aria-label={`GitHub API: ${rateLimit.remaining} of ${rateLimit.limit} requests remaining`}
            >
              API {rateLimit.remaining}/{rateLimit.limit}
            </span>
          )}

          {loading && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--text)",
                display: "inline-block",
              }}
              className="animate-pulse-dot"
              aria-label="Loading"
            />
          )}

          {connection.isConnected && (
            <>
              <button
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh pull requests"
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: loading ? "var(--dim)" : "var(--muted)",
                  background: "none",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  padding: "4px 0",
                  fontFamily: "var(--font)",
                  transition: "color 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = loading ? "var(--dim)" : "var(--muted)";
                }}
              >
                Refresh
              </button>

              <span style={{ color: "var(--border2)", userSelect: "none", fontSize: "0.7rem" }}>|</span>

              <button
                onClick={onDisconnect}
                aria-label="Disconnect from repository"
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  fontFamily: "var(--font)",
                  transition: "color 0.12s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                }}
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
