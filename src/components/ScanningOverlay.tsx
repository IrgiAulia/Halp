"use client";

import { useEffect, useState } from "react";

interface ScanningOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** "demo" shows instant fake progress, "live" slower (real API call) */
  mode?: "demo" | "live";
  /** Called once the animation completes and overlay should unmount */
  onDone: () => void;
}

const STEPS_DEMO = [
  "Indexing pull requests…",
  "Measuring change size…",
  "Detecting AI-generated commits…",
  "Checking PR age…",
  "Mapping file hotspots…",
  "Computing risk scores…",
];

const STEPS_LIVE = [
  "Authenticating token…",
  "Fetching open pull requests…",
  "Enriching commit metadata…",
  "Measuring change size…",
  "Detecting AI-generated commits…",
  "Checking PR age…",
  "Mapping file hotspots…",
  "Computing risk scores…",
];

/**
 * Full-screen scanning overlay.
 * Shows a vertical scan line sweeping down a fake code panel,
 * a progress bar, and cycling status lines — all pure CSS/React,
 * zero external deps.
 */
export default function ScanningOverlay({
  visible,
  mode = "demo",
  onDone,
}: ScanningOverlayProps): React.ReactElement | null {
  const steps = mode === "demo" ? STEPS_DEMO : STEPS_LIVE;
  const stepDuration = mode === "demo" ? 420 : 600; // ms per step
  const totalDuration = steps.length * stepDuration;

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
      setProgress(0);
      setFadeOut(false);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      const pct = Math.round((current / steps.length) * 100);
      setStepIndex(Math.min(current, steps.length - 1));
      setProgress(pct);

      if (current >= steps.length) {
        clearInterval(interval);
        // Short pause at 100%, then fade out
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(onDone, 350);
        }, 300);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [visible, steps.length, stepDuration, onDone]);

  if (!visible) return null;

  const barWidth = `${progress}%`;

  return (
    <div
      className="scanning-overlay"
      role="status"
      aria-live="polite"
      aria-label="Scanning repository…"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut ? 0 : 1,
        transition: fadeOut ? "opacity 0.35s ease-out" : undefined,
      }}
    >
      {/* Scan viewport — fake code panel with sweep line */}
      <div
        aria-hidden="true"
        style={{
          width: 340,
          height: 200,
          position: "relative",
          overflow: "hidden",
          marginBottom: 40,
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Static "code" lines */}
        <CodeLines />

        {/* Sweeping scan line */}
        <div
          className="scan-line"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: "var(--text)",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Status text */}
      <p
        style={{
          fontSize: "0.82rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "var(--text)",
          marginBottom: 16,
          minHeight: "1.4em",
          textAlign: "center",
        }}
      >
        {steps[stepIndex]}
        <span className="scan-blink" style={{ marginLeft: 1 }}>
          _
        </span>
      </p>

      {/* Progress bar */}
      <div
        style={{
          width: 340,
          height: 1,
          backgroundColor: "var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: barWidth,
            backgroundColor: "var(--text)",
            transition: `width ${stepDuration * 0.9}ms linear`,
          }}
        />
      </div>

      {/* Percentage */}
      <p
        className="label-caps"
        style={{ marginTop: 10 }}
        aria-hidden="true"
      >
        {progress}%
      </p>
    </div>
  );
}

/** Decorative rows of placeholder "code" text */
function CodeLines(): React.ReactElement {
  const lines = [
    "analyzing  pr #1842  feat/payments-redesign",
    "signals    size:87   age:12h   ai:0.34",
    "hotspot    /src/payments/checkout.ts  ×3",
    "analyzing  pr #1839  fix/auth-token-refresh",
    "signals    size:23   age:4h    ai:0.12",
    "hotspot    /src/auth/session.ts  ×2",
    "analyzing  pr #1835  chore/deps-upgrade",
    "signals    size:142  age:38h   ai:0.61",
    "hotspot    package-lock.json  ×1",
  ];

  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: "monospace",
            fontSize: "0.68rem",
            color: "var(--muted)",
            padding: "3px 0",
            borderBottom: "1px solid var(--surface)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            opacity: 0.55,
          }}
        >
          {line}
        </div>
      ))}
    </>
  );
}
