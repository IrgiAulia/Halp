import type { PRStats } from "@/types";

interface StatsBarProps {
  stats: PRStats;
  fetchedAt: string | null;
}

/**
 * Stats strip — Palantir-style data row.
 * Large numbers, monospace figures, high-contrast on dark.
 */
export default function StatsBar({
  stats,
  fetchedAt,
}: StatsBarProps): React.ReactElement {
  const fetchedLabel = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <section
      aria-label="Pull request statistics"
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        marginBottom: 48,
        padding: "20px 0",
        display: "flex",
        alignItems: "stretch",
        gap: 0,
      }}
    >
      {[
        { label: "Total", value: stats.total, color: "var(--text)" },
        { label: "Critical", value: stats.critical, color: "var(--risk-critical-dot)" },
        { label: "High", value: stats.high, color: "var(--risk-high-dot)" },
        { label: "Medium", value: stats.medium, color: "var(--risk-medium-dot)" },
        { label: "Low", value: stats.low, color: "var(--risk-low-dot)" },
        { label: "Avg Score", value: stats.averageScore, color: "var(--muted)" },
      ].map(({ label, value, color }, i) => (
        <div
          key={label}
          role="status"
          aria-label={`${label}: ${value}`}
          style={{
            flex: 1,
            borderLeft: i === 0 ? "none" : "1px solid var(--border)",
            paddingLeft: i === 0 ? 0 : 24,
            paddingRight: 24,
          }}
        >
          <span className="label-caps" style={{ display: "block", marginBottom: 6 }}>
            {label}
          </span>
          <span
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color,
              fontVariantNumeric: "tabular-nums",
              display: "block",
            }}
          >
            {value}
          </span>
        </div>
      ))}

      {/* Timestamp */}
      {fetchedLabel && (
        <span
          className="label-caps"
          style={{
            marginLeft: "auto",
            paddingLeft: 24,
            flexShrink: 0,
            alignSelf: "flex-end",
            color: "var(--dim)",
          }}
          aria-label={`Last updated at ${fetchedLabel}`}
        >
          {fetchedLabel}
        </span>
      )}
    </section>
  );
}
