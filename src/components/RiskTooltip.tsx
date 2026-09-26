"use client";

import { useState } from "react";
import type { SignalResult } from "@/types";

interface RiskTooltipProps {
  signals: SignalResult[];
  totalScore: number;
}

const SIGNAL_LABELS: Record<SignalResult["signal"], string> = {
  size: "Size",
  ai_generated: "AI-Generated",
  age: "Age",
  hotspot: "Hotspot",
  commit_complexity: "Commit Quality",
  review_velocity: "Review Coverage",
};

const SIGNAL_WEIGHTS: Record<SignalResult["signal"], string> = {
  size: "20%",
  ai_generated: "20%",
  age: "15%",
  hotspot: "20%",
  commit_complexity: "15%",
  review_velocity: "10%",
};

const SIGNAL_BAR_COLOR: (score: number) => string = (score) => {
  if (score >= 76) return "var(--risk-critical-dot)";
  if (score >= 51) return "var(--risk-high-dot)";
  if (score >= 26) return "var(--risk-medium-dot)";
  return "var(--risk-low-dot)";
};

/**
 * Expandable signal breakdown panel — clean data table layout.
 */
export default function RiskTooltip({
  signals,
  totalScore,
}: RiskTooltipProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Show risk signal breakdown"
        style={{
          fontSize: "0.76rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "var(--font)",
        }}
      >
        {open ? "Hide breakdown ↑" : "Breakdown ↓"}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Risk signal breakdown"
          style={{
            marginTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          {signals.map((signal, i) => (
            <SignalRow
              key={signal.signal}
              signal={signal}
              isLast={i === signals.length - 1}
            />
          ))}

          {/* Total row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 0",
              borderTop: "1px solid var(--line)",
            }}
          >
            <span
              className="label-caps"
              style={{ color: "var(--text)" }}
            >
              Total
            </span>
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "var(--text)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {totalScore}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface SignalRowProps {
  signal: SignalResult;
  isLast: boolean;
}

function SignalRow({ signal, isLast }: SignalRowProps): React.ReactElement {
  const label = SIGNAL_LABELS[signal.signal];
  const weight = SIGNAL_WEIGHTS[signal.signal];
  const barColor = SIGNAL_BAR_COLOR(signal.score);

  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
      }}
    >
      {/* Name + score row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: "0.83rem",
            fontWeight: 600,
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {label}
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 500,
              color: "var(--muted)",
              letterSpacing: "0.06em",
            }}
          >
            {weight}
          </span>
        </span>
        <span
          style={{
            fontSize: "0.83rem",
            fontWeight: 700,
            color: "var(--text)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {signal.score}
        </span>
      </div>

      {/* Bar */}
      <div
        style={{
          height: 2,
          backgroundColor: "var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
        role="progressbar"
        aria-valuenow={signal.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${signal.score}/100`}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${signal.score}%`,
            backgroundColor: barColor,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Detail text */}
      {signal.details.length > 0 && (
        <p
          style={{
            fontSize: "0.76rem",
            color: "var(--muted)",
            marginTop: 5,
            lineHeight: 1.55,
          }}
        >
          {signal.details[0]}
        </p>
      )}
    </div>
  );
}
