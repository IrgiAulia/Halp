import type { RiskLevel } from "@/types";

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: "sm" | "md";
}

const LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; dot: string; textColor: string; bgColor: string }
> = {
  low: {
    label: "Low",
    dot: "var(--risk-low-dot)",
    textColor: "var(--muted)",
    bgColor: "transparent",
  },
  medium: {
    label: "Medium",
    dot: "var(--risk-medium-dot)",
    textColor: "var(--text)",
    bgColor: "transparent",
  },
  high: {
    label: "High",
    dot: "var(--risk-high-dot)",
    textColor: "var(--text)",
    bgColor: "transparent",
  },
  critical: {
    label: "Critical",
    dot: "var(--risk-critical-dot)",
    textColor: "var(--risk-critical-fg)",
    bgColor: "transparent",
  },
};

/**
 * Minimal risk badge — dot indicator + label only. No borders, no pills.
 * Uses dot color + text for accessibility (not color-only).
 */
export default function RiskBadge({
  level,
  score,
  size = "md",
}: RiskBadgeProps): React.ReactElement {
  const { label, dot, textColor } = LEVEL_CONFIG[level];

  const dotSize = size === "sm" ? 7 : 9;
  const fontSize = size === "sm" ? "0.74rem" : "0.82rem";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: textColor,
      }}
      aria-label={`Risk: ${label}${score !== undefined ? ` (${score}/100)` : ""}`}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          backgroundColor: dot,
          flexShrink: 0,
          display: "inline-block",
        }}
        aria-hidden="true"
      />
      {label}
      {score !== undefined && (
        <span
          style={{
            fontWeight: 500,
            opacity: 0.6,
            fontSize: "0.9em",
            letterSpacing: "0.04em",
          }}
        >
          {score}
        </span>
      )}
    </span>
  );
}
