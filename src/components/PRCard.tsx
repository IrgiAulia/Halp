import type { ScoredPR } from "@/types";
import RiskBadge from "@/components/RiskBadge";
import RiskTooltip from "@/components/RiskTooltip";

interface PRCardProps {
  pr: ScoredPR;
}

/**
 * PR row — Palantir-style data table row.
 * Dense, monospace metadata, high-contrast on dark.
 */
export default function PRCard({ pr }: PRCardProps): React.ReactElement {
  const createdAt = new Date(pr.created_at);
  const hoursAgo = Math.round((Date.now() - createdAt.getTime()) / 3600000);
  const ageLabel =
    hoursAgo < 1
      ? "< 1h"
      : hoursAgo < 48
      ? `${hoursAgo}h`
      : `${Math.round(hoursAgo / 24)}d`;

  const totalLines = (pr.additions ?? 0) + (pr.deletions ?? 0);

  // Score bar width
  const scoreBarWidth = `${pr.scoring.totalScore}%`;
  const scoreBarColor =
    pr.scoring.totalScore >= 76
      ? "var(--risk-critical-dot)"
      : pr.scoring.totalScore >= 51
      ? "var(--risk-high-dot)"
      : pr.scoring.totalScore >= 26
      ? "var(--risk-medium-dot)"
      : "var(--risk-low-dot)";

  return (
    <article
      style={{ paddingTop: 22, paddingBottom: 22 }}
      aria-label={`PR #${pr.number}: ${pr.title}, Risk: ${pr.scoring.riskLevel}`}
    >
      {/* Top row: badge + PR number + draft + score bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <RiskBadge
          level={pr.scoring.riskLevel}
          score={pr.scoring.totalScore}
          size="sm"
        />

        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "var(--dim)",
            fontFamily: "monospace",
          }}
        >
          #{pr.number}
        </span>

        {pr.draft && (
          <span
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--muted)",
              border: "1px solid var(--border2)",
              padding: "1px 5px",
            }}
          >
            Draft
          </span>
        )}

        {/* Inline score bar — fills remaining space */}
        <div
          style={{
            flex: 1,
            height: 1,
            backgroundColor: "var(--border)",
            position: "relative",
            overflow: "hidden",
            marginLeft: 4,
          }}
          aria-hidden="true"
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: scoreBarWidth,
              backgroundColor: scoreBarColor,
            }}
          />
        </div>

        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--dim)",
            fontFamily: "monospace",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {pr.scoring.totalScore}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text)",
          lineHeight: 1.4,
          marginBottom: 10,
        }}
      >
        <a
          href={pr.html_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "inherit",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
            (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline";
            (e.currentTarget as HTMLAnchorElement).style.textDecorationColor = "var(--border2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none";
          }}
          aria-label={`Open PR #${pr.number}: ${pr.title} on GitHub`}
        >
          {pr.title}
        </a>
      </h3>

      {/* Metadata row — monospace data */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "3px 20px",
          marginBottom: 14,
        }}
      >
        {[
          { label: "by", value: pr.user.login },
          { label: "age", value: `${ageLabel}` },
          { label: "+", value: `${pr.additions}`, color: "var(--risk-low-dot)" },
          { label: "−", value: `${pr.deletions}`, color: "var(--risk-critical-dot)" },
          { label: "files", value: String(pr.changed_files) },
          { label: "lines", value: String(totalLines) },
        ].map(({ label, value, color }) => (
          <span
            key={label}
            style={{
              fontSize: "0.78rem",
              color: "var(--muted)",
              fontFamily: "monospace",
            }}
          >
            <span
              style={{
                fontSize: "0.62rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginRight: 4,
                color: "var(--dim)",
                fontFamily: "var(--font)",
              }}
            >
              {label}
            </span>
            <span style={{ color: color ?? "var(--muted)" }}>{value}</span>
          </span>
        ))}
      </div>

      {/* Signal breakdown */}
      <RiskTooltip
        signals={pr.scoring.signals}
        totalScore={pr.scoring.totalScore}
      />
    </article>
  );
}
