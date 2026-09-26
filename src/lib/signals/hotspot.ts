/**
 * PR Risk Radar — Hotspot Signal
 *
 * Formula:
 *   riskyFileScore  = min(100, riskyFiles.length * pointsPerRiskyFile)
 *   overlapScore    = min(maxOverlapBonus, overlapCount * pointsPerOverlap)
 *   score           = min(100, riskyFileScore + overlapScore)
 *
 * Weight: 20%
 */

import type { GitHubPR, SignalResult } from "@/types";
import { HOTSPOT_CONFIG } from "@/lib/config";

/**
 * Compute the hotspot risk signal for a PR.
 * Checks for risky file path patterns AND cross-PR file overlap.
 * Pure function — zero I/O, no side effects.
 *
 * @param pr - PR with files populated
 * @param allOtherPRFiles - File paths from all OTHER open PRs (for overlap detection)
 * @returns SignalResult with normalized score 0–100
 */
export function computeHotspotSignal(
  pr: GitHubPR,
  allOtherPRFiles: string[][] = []
): SignalResult {
  const { riskyPathPatterns, pointsPerRiskyFile, pointsPerOverlap, maxOverlapBonus } =
    HOTSPOT_CONFIG;

  const prFiles = (pr.files ?? []).map((f) => f.filename);
  const details: string[] = [];

  // --- Risky path detection ---
  const riskyFiles = prFiles.filter((filename) =>
    riskyPathPatterns.some((pattern) => pattern.test(filename))
  );

  const riskyFileScore = Math.min(100, riskyFiles.length * pointsPerRiskyFile);

  if (riskyFiles.length > 0) {
    details.push(
      `${riskyFiles.length} risky file${riskyFiles.length > 1 ? "s" : ""} detected: ${riskyFiles.slice(0, 3).join(", ")}${riskyFiles.length > 3 ? `… (+${riskyFiles.length - 3} more)` : ""}`
    );
  }

  // --- Cross-PR file overlap ---
  const otherFilesFlat = new Set(allOtherPRFiles.flat());
  const overlappingFiles = prFiles.filter((f) => otherFilesFlat.has(f));
  const overlapScore = Math.min(
    maxOverlapBonus,
    overlappingFiles.length * pointsPerOverlap
  );

  if (overlappingFiles.length > 0) {
    details.push(
      `${overlappingFiles.length} file${overlappingFiles.length > 1 ? "s" : ""} also modified in other open PRs: ${overlappingFiles.slice(0, 2).join(", ")}${overlappingFiles.length > 2 ? "…" : ""}`
    );
  }

  if (details.length === 0) {
    details.push("No risky paths or file overlaps detected");
  }

  const score = Math.min(100, Math.round(riskyFileScore + overlapScore));

  const label =
    score === 0
      ? "No hotspot files"
      : riskyFiles.length > 0 && overlappingFiles.length > 0
      ? `Risky paths + cross-PR overlap`
      : riskyFiles.length > 0
      ? `${riskyFiles.length} risky path${riskyFiles.length > 1 ? "s" : ""}`
      : `${overlappingFiles.length} cross-PR file${overlappingFiles.length > 1 ? "s" : ""}`;

  return {
    signal: "hotspot",
    score,
    label,
    details,
  };
}
