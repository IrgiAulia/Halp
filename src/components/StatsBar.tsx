import type { PRStats } from "@/types";

interface StatsBarProps {
  stats: PRStats;
  fetchedAt: string | null;
}

/**
 * Stats strip — horizontal data row with dividers. No cards, no borders.
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
        marginBottom: 40,
        padding: "16px 0",
        display: "flex",
        alignItems: "center",
        gap: 0,
      }}
    >
      {/* Stat items */}
      {[
        { label: "Total", value: stats.total, color: "var(--text)" },
        { label: "Critical", value: stats.critical, color: "var(--risk-critical-dot)" },
        { label: "High", value: stats.high, color: "var(--risk-high-dot)" },
        { label: "Medium", value: stats.medium, color: "var(--risk-medium-dot)" },
        { label: "Low", value: stats.low, color: "var(--risk-low-dot)" },
      ].map(({ label, value, color }, i) => (
        <div
          key={label}
          role="status"
          aria-label={`${label}: ${value}`}
          style={{
            flex: 1,
            borderLeft: i === 0 ? "none" : "1px solid var(--border)",
            paddingLeft: i === 0 ? 0 : 20,
            paddingRight: 20,
          }}
        >
          <span className="label-caps" style={{ display: "block", marginBottom: 4 }}>
            {label}
          </span>
          <span
            style={{
              fontSize: "1.6rem",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color,
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
          style={{ marginLeft: "auto", paddingLeft: 20, flexShrink: 0 }}
          aria-label={`Last updated at ${fetchedLabel}`}
        >
          {fetchedLabel}
        </span>
      )}
    </section>
  );
}
