/**
 * PR Risk Radar — AI-Generated Signal
 *
 * Formula (max 100 points total):
 *   coAuthorPoints (50)  — Co-Authored-By trailer matches AI bot pattern
 *   commitBurstPoints (30) — ≥3 commits in ≤10 minutes (suspiciously fast)
 *   ratioAnomalyPoints (20) — additions/deletions ratio > 20 (AI rarely deletes)
 *
 * Weight: 25%
 */

import type { GitHubPR, SignalResult } from "@/types";
import { AI_CONFIG } from "@/lib/config";

/**
 * Compute the AI-generated risk signal for a PR.
 * Pure function — zero I/O, no side effects.
 *
 * @param pr - PR with commitList populated
 * @returns SignalResult with normalized score 0–100
 */
export function computeAISignal(pr: GitHubPR): SignalResult {
  const {
    coAuthorPoints,
    commitBurstPoints,
    commitBurstMinutes,
    commitBurstMin,
    ratioAnomalyPoints,
    ratioAnomalyThreshold,
    coAuthorPatterns,
  } = AI_CONFIG;

  const commits = pr.commitList ?? [];
  const details: string[] = [];
  let score = 0;

  // --- Co-author detection ---
  const allCoAuthors = commits.flatMap((c) => c.coAuthors ?? []);
  const aiCoAuthor = allCoAuthors.find((ca) =>
    coAuthorPatterns.some((pattern) => pattern.test(ca))
  );

  // Also check PR body for AI generation markers
  const bodyHasAI =
    pr.body != null &&
    coAuthorPatterns.some((pattern) => pattern.test(pr.body ?? ""));

  if (aiCoAuthor || bodyHasAI) {
    score += coAuthorPoints;
    details.push(
      `AI co-author detected: ${aiCoAuthor ?? "AI reference in PR body"} (+${coAuthorPoints}pts)`
    );
  }

  // --- AI commit message pattern detection ---
  const { aiMessagePatterns, aiMessagePoints } = AI_CONFIG;
  const aiLikeCommits = commits.filter((c) =>
    aiMessagePatterns.some((pattern) =>
      pattern.test(c.commit.message.split("\n")[0])
    )
  );
  if (aiLikeCommits.length > 0 && !aiCoAuthor) {
    // Only add if no explicit co-author already caught
    const partial = Math.round(aiMessagePoints * Math.min(1, aiLikeCommits.length / 3));
    score += partial;
    details.push(
      `${aiLikeCommits.length} commit message${aiLikeCommits.length > 1 ? "s" : ""} match AI writing patterns (+${partial}pts)`
    );
  }

  // --- Commit burst detection ---
  if (commits.length >= commitBurstMin) {
    const timestamps = commits
      .map((c) => new Date(c.commit.author.date).getTime())
      .sort((a, b) => a - b);

    const burstWindowMs = commitBurstMinutes * 60 * 1000;
    let burstDetected = false;

    for (let i = 0; i <= timestamps.length - commitBurstMin; i++) {
      const window = timestamps[i + commitBurstMin - 1] - timestamps[i];
      if (window <= burstWindowMs) {
        burstDetected = true;
        break;
      }
    }

    if (burstDetected) {
      score += commitBurstPoints;
      details.push(
        `Commit burst: ${commitBurstMin}+ commits within ${commitBurstMinutes} minutes (+${commitBurstPoints}pts)`
      );
    }
  }

  // --- Addition/deletion ratio anomaly ---
  const additions = pr.additions ?? 0;
  const deletions = pr.deletions ?? 0;

  if (deletions > 0 && additions / deletions > ratioAnomalyThreshold) {
    score += ratioAnomalyPoints;
    details.push(
      `High add/delete ratio: ${additions}/${deletions} = ${(additions / deletions).toFixed(1)} (>${ratioAnomalyThreshold}x) (+${ratioAnomalyPoints}pts)`
    );
  } else if (deletions === 0 && additions > 200) {
    // Pure addition with no deletions — also suspicious
    score += ratioAnomalyPoints;
    details.push(
      `Pure additions: ${additions} lines added, zero deleted (+${ratioAnomalyPoints}pts)`
    );
  }

  if (details.length === 0) {
    details.push("No AI generation indicators detected");
  }

  const clamped = Math.min(100, Math.max(0, score));

  const label =
    clamped === 0
      ? "No AI indicators"
      : clamped < 50
      ? "Possible AI assistance"
      : "Likely AI-generated";

  return {
    signal: "ai_generated",
    score: clamped,
    label,
    details,
  };
}
