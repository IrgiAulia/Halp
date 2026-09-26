/**
 * PR Risk Radar — Review Velocity Signal (NEW)
 *
 * Formula (max 100 points total):
 *   noReviewerPoints      — no reviewers requested on the PR
 *   freshPushPoints       — PR was updated very recently (may be half-baked)
 *   highCommentPoints     — too many comments = contentious change
 *   changesRequestedPts   — reviewer requested changes (still not addressed)
 *
 * Weight: 10%
 *
 * Rationale: reviewer engagement (or lack of it) is a strong proxy for
 * whether a PR is ready and safe to merge.
 */

import type { GitHubPR, SignalResult } from "@/types";
import { REVIEW_VELOCITY_CONFIG } from "@/lib/config";

/**
 * Compute the review velocity signal for a PR.
 * Pure function — zero I/O, no side effects.
 *
 * @param pr - PR with reviewers and comments populated
 * @returns SignalResult with normalized score 0–100
 */
export function computeReviewVelocitySignal(pr: GitHubPR): SignalResult {
  const {
    noReviewerPoints,
    freshPushMinutes,
    freshPushPoints,
    highCommentThreshold,
    highCommentPoints,
    changesRequestedPoints,
  } = REVIEW_VELOCITY_CONFIG;

  const details: string[] = [];
  let score = 0;

  // --- No reviewers assigned ---
  const requestedReviewers = pr.requested_reviewers ?? [];
  const reviewStates = pr.reviewStates ?? [];

  if (requestedReviewers.length === 0 && reviewStates.length === 0) {
    score += noReviewerPoints;
    details.push(`No reviewers assigned or requested (+${noReviewerPoints}pts)`);
  }

  // --- Freshly pushed (within the last N minutes) ---
  const updatedAt = new Date(pr.updated_at).getTime();
  const minutesSinceUpdate = (Date.now() - updatedAt) / (1000 * 60);
  if (minutesSinceUpdate <= freshPushMinutes) {
    score += freshPushPoints;
    details.push(
      `Updated ${Math.round(minutesSinceUpdate)}m ago — may be freshly force-pushed (+${freshPushPoints}pts)`
    );
  }

  // --- High comment count (contentious) ---
  const commentCount = pr.comments ?? 0;
  const reviewCommentCount = pr.review_comments ?? 0;
  const totalComments = commentCount + reviewCommentCount;

  if (totalComments >= highCommentThreshold) {
    score += highCommentPoints;
    details.push(
      `${totalComments} comments — contentious or unclear PR (+${highCommentPoints}pts)`
    );
  }

  // --- Reviewer requested changes ---
  const hasChangesRequested = reviewStates.includes("CHANGES_REQUESTED");
  if (hasChangesRequested) {
    score += changesRequestedPoints;
    details.push(`Reviewer has requested changes (+${changesRequestedPoints}pts)`);
  }

  if (details.length === 0) {
    details.push("Reviewers assigned, no blocking states");
  }

  const clamped = Math.min(100, Math.max(0, score));

  const label =
    clamped === 0
      ? "Reviewers engaged"
      : clamped < 40
      ? "Needs reviewer attention"
      : clamped < 70
      ? "Low review coverage"
      : "Unreviewed or blocked";

  return {
    signal: "review_velocity",
    score: clamped,
    label,
    details,
  };
}
