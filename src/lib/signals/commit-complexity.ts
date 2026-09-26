/**
 * PR Risk Radar — Commit Complexity Signal (NEW)
 *
 * Formula (max 100 points total):
 *   genericMessagePenalty — commits with vague messages (wip, fix, update)
 *   highChurnPenalty      — too many commits relative to file count
 *   churnRatioPenalty     — commits/files ratio exceeds threshold
 *
 * Weight: 15%
 *
 * Rationale: low-quality commit history signals rushed or AI-assisted work
 * that hasn't been organized for reviewability.
 */

import type { GitHubPR, SignalResult } from "@/types";
import { COMMIT_COMPLEXITY_CONFIG } from "@/lib/config";

/**
 * Compute the commit complexity signal for a PR.
 * Pure function — zero I/O, no side effects.
 *
 * @param pr - PR with commitList populated
 * @returns SignalResult with normalized score 0–100
 */
export function computeCommitComplexitySignal(pr: GitHubPR): SignalResult {
  const {
    genericMessagePatterns,
    pointsPerGenericCommit,
    maxGenericPenalty,
    highChurnCommitsThreshold,
    highChurnPoints,
    churnRatioThreshold,
    churnRatioPoints,
  } = COMMIT_COMPLEXITY_CONFIG;

  const commits = pr.commitList ?? [];
  const changedFiles = pr.changed_files ?? 1;
  const details: string[] = [];
  let score = 0;

  // --- Generic commit message detection ---
  const genericCommits = commits.filter((c) =>
    genericMessagePatterns.some((pattern) =>
      pattern.test(c.commit.message.split("\n")[0].trim())
    )
  );

  if (genericCommits.length > 0) {
    const penalty = Math.min(
      maxGenericPenalty,
      genericCommits.length * pointsPerGenericCommit
    );
    score += penalty;
    details.push(
      `${genericCommits.length} low-quality commit message${genericCommits.length > 1 ? "s" : ""}: "${genericCommits[0].commit.message.split("\n")[0].slice(0, 40)}"${genericCommits.length > 1 ? `… (+${genericCommits.length - 1} more)` : ""} (+${penalty}pts)`
    );
  }

  // --- High commit count (churn) ---
  if (commits.length >= highChurnCommitsThreshold) {
    score += highChurnPoints;
    details.push(
      `High commit count: ${commits.length} commits suggests iterative churn (+${highChurnPoints}pts)`
    );
  }

  // --- Commits-to-files churn ratio ---
  const commitToFileRatio = changedFiles > 0 ? commits.length / changedFiles : 0;
  if (commitToFileRatio >= churnRatioThreshold && commits.length >= 4) {
    score += churnRatioPoints;
    details.push(
      `High commit/file ratio: ${commits.length} commits for ${changedFiles} files (${commitToFileRatio.toFixed(1)}x) (+${churnRatioPoints}pts)`
    );
  }

  if (details.length === 0) {
    details.push(
      commits.length === 0
        ? "No commit data available"
        : `${commits.length} commits with clear messages`
    );
  }

  const clamped = Math.min(100, Math.max(0, score));

  const label =
    clamped === 0
      ? "Clean commit history"
      : clamped < 40
      ? "Minor commit quality issues"
      : clamped < 70
      ? "Poor commit hygiene"
      : "Chaotic commit history";

  return {
    signal: "commit_complexity",
    score: clamped,
    label,
    details,
  };
}
