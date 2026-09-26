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
 * Sticky header — logo + "Halp" wordmark in Gabarito, then repo info.
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
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 24px",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <HalpLogo size={26} />

          <span
            style={{
              fontFamily: "var(--font-gabarito), var(--font), sans-serif",
              fontWeight: 900,
              fontSize: "1.1rem",
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
                  color: "var(--border)",
                  fontSize: "0.85rem",
                  userSelect: "none",
                  marginLeft: 4,
                }}
              >
                /
              </span>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span className="sr-only">Connected to: </span>
                {connection.owner}/{connection.repo}
                {connection.login && (
                  <span style={{ marginLeft: 6, color: "var(--text)", fontWeight: 600 }}>
                    @{connection.login}
                  </span>
                )}
              </span>
            </>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          {rateLimit && (
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: rateLimitLow ? "var(--risk-critical-fg)" : "var(--muted)",
              }}
              aria-label={`GitHub API: ${rateLimit.remaining} of ${rateLimit.limit} requests remaining`}
            >
              {rateLimit.remaining}/{rateLimit.limit}
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
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  color: "var(--text)",
                  background: "none",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.4 : 1,
                  padding: "4px 0",
                  fontFamily: "var(--font)",
                }}
              >
                Refresh
              </button>

              <span style={{ color: "var(--border)", userSelect: "none" }}>·</span>

              <button
                onClick={onDisconnect}
                aria-label="Disconnect from repository"
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  color: "var(--muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  fontFamily: "var(--font)",
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
