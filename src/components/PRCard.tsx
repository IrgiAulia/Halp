import type { ScoredPR } from "@/types";
import RiskBadge from "@/components/RiskBadge";
import RiskTooltip from "@/components/RiskTooltip";

interface PRCardProps {
  pr: ScoredPR;
}

/**
 * PR card — horizontal rule separation, no card borders/shadows.
 * Tabular data feel — inspired by teenage.engineering product spec sheets.
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

  return (
    <article
      style={{ paddingTop: 20, paddingBottom: 20 }}
      aria-label={`PR #${pr.number}: ${pr.title}, Risk: ${pr.scoring.riskLevel}`}
    >
      {/* Top row: badge + PR number + draft */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <RiskBadge
          level={pr.scoring.riskLevel}
          score={pr.scoring.totalScore}
          size="sm"
        />

        <span
          style={{
            fontSize: "0.76rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--muted)",
          }}
        >
          #{pr.number}
        </span>

        {pr.draft && (
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--muted)",
              border: "1px solid var(--border)",
              padding: "1px 6px",
            }}
          >
            Draft
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text)",
          lineHeight: 1.4,
          marginBottom: 8,
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
            (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none";
          }}
          aria-label={`Open PR #${pr.number}: ${pr.title} on GitHub`}
        >
          {pr.title}
        </a>
      </h3>

      {/* Metadata row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
          marginBottom: 12,
        }}
      >
        {[
          { label: "by", value: pr.user.login },
          { label: "opened", value: `${ageLabel} ago` },
          {
            label: "lines",
            value: `+${pr.additions} −${pr.deletions}`,
          },
          { label: "files", value: String(pr.changed_files) },
        ].map(({ label, value }) => (
          <span
            key={label}
            style={{ fontSize: "0.82rem", color: "var(--muted)" }}
          >
            <span
              style={{
                fontSize: "0.68rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 600,
                marginRight: 4,
                color: "var(--border)",
              }}
            >
              {label}
            </span>
            {value}
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
