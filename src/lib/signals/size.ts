/**
 * PR Risk Radar — Size Signal
 *
 * Formula:
 *   baseScore = clamp((lines - minLines) / (maxLines - minLines), 0, 1) * 100
 *   bonus     = changedFiles > manyFilesThreshold ? manyFilesBonus : 0
 *   score     = clamp(baseScore + bonus, 0, 100)
 *
 * Weight: 30%
 */

import type { GitHubPR, SignalResult } from "@/types";
import { SIZE_CONFIG } from "@/lib/config";

/**
 * Compute the size-based risk signal for a PR.
 * Pure function — zero I/O, no side effects.
 *
 * @param pr - PR with additions and deletions populated
 * @returns SignalResult with normalized score 0–100
 */
export function computeSizeSignal(pr: GitHubPR): SignalResult {
  const {
    minLines,
    maxLines,
    manyFilesThreshold,
    manyFilesBonus,
    criticalFilesThreshold,
    criticalFilesBonus,
  } = SIZE_CONFIG;

  const totalLines = (pr.additions ?? 0) + (pr.deletions ?? 0);
  const changedFiles = pr.changed_files ?? 0;

  const baseScore =
    Math.min(1, Math.max(0, (totalLines - minLines) / (maxLines - minLines))) * 100;

  const fileBonus = changedFiles > manyFilesThreshold ? manyFilesBonus : 0;
  const criticalBonus = changedFiles > criticalFilesThreshold ? criticalFilesBonus : 0;
  const score = Math.min(100, Math.round(baseScore + fileBonus + criticalBonus));

  const details: string[] = [
    `${totalLines} lines changed (${pr.additions ?? 0} additions, ${pr.deletions ?? 0} deletions)`,
    `${changedFiles} files changed`,
  ];

  if (changedFiles > manyFilesThreshold) {
    details.push(`+${manyFilesBonus} bonus: more than ${manyFilesThreshold} files changed`);
  }
  if (changedFiles > criticalFilesThreshold) {
    details.push(`+${criticalFilesBonus} bonus: more than ${criticalFilesThreshold} files — very broad change`);
  }

  const label =
    totalLines < minLines
      ? "Small PR"
      : totalLines > maxLines
      ? "Very large PR"
      : `${totalLines} lines changed`;

  return {
    signal: "size",
    score,
    label,
    details,
  };
}
