/**
 * PR Risk Radar — Scoring Engine
 * Orchestrates 4 signals into a final weighted risk score.
 */

import type { GitHubPR, ScoringResult, SignalResult } from "@/types";
import { SIGNAL_WEIGHTS, scoreToRiskLevel } from "@/lib/config";
import { computeSizeSignal } from "@/lib/signals/size";
import { computeAISignal } from "@/lib/signals/ai-generated";
import { computeAgeSignal } from "@/lib/signals/age";
import { computeHotspotSignal } from "@/lib/signals/hotspot";

/**
 * Compute the full risk score for a PR.
 * All 4 signals run synchronously (pure functions, zero I/O).
 *
 * @param pr - Enriched PR with files and commitList populated
 * @param allPRFiles - All file paths across all open PRs (for hotspot cross-PR overlap)
 * @returns Full scoring result with per-signal breakdown
 */
export function scorePR(
  pr: GitHubPR,
  allPRFiles: string[][] = []
): ScoringResult {
  const signals: SignalResult[] = [
    computeSizeSignal(pr),
    computeAISignal(pr),
    computeAgeSignal(pr),
    computeHotspotSignal(pr, allPRFiles),
  ];

  const totalScore = computeWeightedScore(signals);
  const riskLevel = scoreToRiskLevel(totalScore);

  return {
    totalScore,
    riskLevel,
    signals,
  };
}

/**
 * Apply weights from SIGNAL_WEIGHTS to an ordered array of signal results.
 * Returns a rounded integer score 0–100.
 *
 * @param signals - Array of SignalResult in order: size, ai_generated, age, hotspot
 */
export function computeWeightedScore(signals: SignalResult[]): number {
  const weightKeys = Object.keys(SIGNAL_WEIGHTS) as Array<
    keyof typeof SIGNAL_WEIGHTS
  >;

  let total = 0;
  for (const signal of signals) {
    const weight = SIGNAL_WEIGHTS[signal.signal as keyof typeof SIGNAL_WEIGHTS];
    if (weight !== undefined) {
      total += signal.score * weight;
    }
  }

  return Math.round(Math.max(0, Math.min(100, total)));
}

/**
 * Score all PRs in a list, passing all their file paths for hotspot cross-PR detection.
 *
 * @param prs - Enriched PRs
 * @returns Same PRs with a `scoring` property attached
 */
export function scoreAllPRs(prs: GitHubPR[]): Array<GitHubPR & { scoring: ScoringResult }> {
  const allPRFiles = prs.map((pr) =>
    (pr.files ?? []).map((f) => f.filename)
  );

  return prs.map((pr, idx) => {
    const otherFiles = allPRFiles.filter((_, i) => i !== idx);
    return {
      ...pr,
      scoring: scorePR(pr, otherFiles),
    };
  });
}
