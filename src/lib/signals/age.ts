/**
 * PR Risk Radar — Age Signal
 *
 * Formula:
 *   hoursOld = (now - createdAt) / 3_600_000
 *   score    = clamp((hoursOld - minHours) / (maxHours - minHours), 0, 1) * 100
 *
 * Weight: 25%
 */

import type { GitHubPR, SignalResult } from "@/types";
import { AGE_CONFIG } from "@/lib/config";

/**
 * Compute the age-based risk signal for a PR.
 * Pure function — zero I/O, no side effects.
 *
 * @param pr - PR with created_at populated
 * @param now - Optional override for current time (useful for testing)
 * @returns SignalResult with normalized score 0–100
 */
export function computeAgeSignal(
  pr: GitHubPR,
  now: number = Date.now()
): SignalResult {
  const { minHours, maxHours } = AGE_CONFIG;

  const createdAt = new Date(pr.created_at).getTime();
  const hoursOld = (now - createdAt) / (1000 * 60 * 60);

  const score = Math.round(
    Math.min(1, Math.max(0, (hoursOld - minHours) / (maxHours - minHours))) * 100
  );

  const hoursDisplay =
    hoursOld < 1
      ? `${Math.round(hoursOld * 60)} minutes`
      : hoursOld < 48
      ? `${Math.round(hoursOld)} hours`
      : `${Math.round(hoursOld / 24)} days`;

  const label =
    hoursOld < minHours
      ? `Very fresh (${hoursDisplay} old)`
      : hoursOld > maxHours
      ? `Stale (${hoursDisplay} old)`
      : `${hoursDisplay} old`;

  return {
    signal: "age",
    score,
    label,
    details: [
      `PR opened ${hoursDisplay} ago`,
      `Risk window: ${minHours}h (low) → ${maxHours}h (high)`,
    ],
  };
}
