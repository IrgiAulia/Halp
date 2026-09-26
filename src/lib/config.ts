/**
 * PR Risk Radar — Configuration
 * All scoring weights and thresholds live here.
 * Tune numbers here, not in signal code.
 */

import type { RiskLevel } from "@/types";

// ---------------------------------------------------------------------------
// Signal weights (must sum to 1.0)
// 6 signals — rebalanced for sensitivity
// ---------------------------------------------------------------------------

export const SIGNAL_WEIGHTS = {
  size:               0.20,  // lines + files
  ai_generated:       0.20,  // AI co-author / burst / ratio
  age:                0.15,  // how stale the PR is
  hotspot:            0.20,  // risky paths + cross-PR overlap
  commit_complexity:  0.15,  // commit message quality + churn
  review_velocity:    0.10,  // reviewer engagement signals
} as const satisfies Record<string, number>;

// Verify weights sum to 1 at module load
const weightSum = Object.values(SIGNAL_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.001) {
  throw new Error(
    `Signal weights must sum to 1.0, got ${weightSum}. Fix SIGNAL_WEIGHTS in config.ts`
  );
}

// ---------------------------------------------------------------------------
// Size signal thresholds
// ---------------------------------------------------------------------------

export const SIZE_CONFIG = {
  /** Lines changed below this → score 0 */
  minLines: 30,
  /** Lines changed above this → score 100 */
  maxLines: 800,
  /** Files changed above this → bonus score added */
  manyFilesThreshold: 15,
  /** Bonus points for exceeding manyFilesThreshold */
  manyFilesBonus: 20,
  /** Files above this get an additional penalty */
  criticalFilesThreshold: 30,
  criticalFilesBonus: 15,
} as const;

// ---------------------------------------------------------------------------
// AI-generated signal thresholds
// ---------------------------------------------------------------------------

export const AI_CONFIG = {
  /** Points awarded when co-author trailer is detected */
  coAuthorPoints: 50,
  /** Points awarded when commit burst pattern detected */
  commitBurstPoints: 35,
  /** Minutes threshold for "suspiciously fast" commit burst */
  commitBurstMinutes: 8,
  /** Minimum commits in burst window to trigger */
  commitBurstMin: 3,
  /** Points awarded for addition/deletion ratio anomaly */
  ratioAnomalyPoints: 20,
  /** Ratio of additions to deletions above which anomaly is flagged */
  ratioAnomalyThreshold: 15,
  /** Additional points for commit message patterns typical of AI */
  aiMessagePoints: 25,
  /** AI co-author patterns to detect (matches stripped author strings and raw trailer lines) */
  coAuthorPatterns: [
    /(?:co-authored-by:.*)?github-actions/i,
    /(?:co-authored-by:.*)?copilot/i,
    /(?:co-authored-by:.*)?\bbot\b/i,
    /(?:co-authored-by:.*)?\[bot\]/i,
    /generated.by.*(claude|gpt|gemini|copilot|cursor)/i,
  ],
  /** AI-characteristic commit message patterns */
  aiMessagePatterns: [
    /^(feat|fix|chore|refactor|docs|style|test):.{80,}/i, // Very long conventional commits
    /implement.*(feature|functionality|system)/i,
    /add comprehensive/i,
    /update.*to (handle|support|improve)/i,
    /ensure.*(?:proper|correct|appropriate)/i,
    /(?:robust|comprehensive|sophisticated)\s/i,
  ],
} as const;

// ---------------------------------------------------------------------------
// Age signal thresholds
// ---------------------------------------------------------------------------

export const AGE_CONFIG = {
  /** Hours old below this → score 0 */
  minHours: 2,
  /** Hours old above this → score 100 */
  maxHours: 48,
  /** PRs open this long with no update get an extra stagnation penalty */
  stagnationHours: 72,
  stagnationBonus: 15,
} as const;

// ---------------------------------------------------------------------------
// Hotspot signal thresholds
// ---------------------------------------------------------------------------

export const HOTSPOT_CONFIG = {
  /** File paths matching these patterns are considered risky */
  riskyPathPatterns: [
    /\/auth\//i,
    /\/authentication\//i,
    /\/payment\//i,
    /\/billing\//i,
    /\/admin\//i,
    /\/config\//i,
    /\/security\//i,
    /\/secret/i,
    /\/credentials/i,
    /\/tokens?\//i,
    /\/keys?\//i,
    /\.env/i,
    /migration/i,
    /schema\.(ts|js|sql)/i,
    /middleware/i,
    /\/_middleware/i,
    /\/guards?\//i,
    /\/interceptors?\//i,
  ],
  /** Points per risky file (capped at 100) */
  pointsPerRiskyFile: 18,
  /** Points per cross-PR file overlap */
  pointsPerOverlap: 12,
  /** Maximum overlap bonus */
  maxOverlapBonus: 40,
} as const;

// ---------------------------------------------------------------------------
// Commit complexity signal thresholds (NEW)
// ---------------------------------------------------------------------------

export const COMMIT_COMPLEXITY_CONFIG = {
  /**
   * Score is derived from:
   * - Poor commit messages (generic, no context)
   * - Very high commit count relative to file count
   * - Force-push indicators (sha divergence)
   * - Squash-heavy patterns
   */

  /** Commits that match these are flagged as low-quality */
  genericMessagePatterns: [
    /^(wip|fix|fixes|update|updates|misc|test|tests|temp|tmp|cleanup|clean up)\s*$/i,
    /^(commit|changes?|stuff|asdf|qwerty|aaa+)\s*$/i,
    /^\.+$/,  // just dots
    /^(add|added|adds)\s*$/i,
  ],
  /** Points per generic commit message */
  pointsPerGenericCommit: 12,
  /** Cap for generic message penalty */
  maxGenericPenalty: 48,

  /** High churn = many tiny commits on same files */
  highChurnCommitsThreshold: 8,
  highChurnPoints: 20,

  /** Ratio of commits to files — many commits / few files = churn */
  churnRatioThreshold: 3,
  churnRatioPoints: 15,
} as const;

// ---------------------------------------------------------------------------
// Review velocity signal thresholds (NEW)
// ---------------------------------------------------------------------------

export const REVIEW_VELOCITY_CONFIG = {
  /**
   * Score is derived from:
   * - No reviewers assigned
   * - PR updated very recently (may be half-baked)
   * - Very first PR from this author (no track record)
   * - Very high number of comments (contentious change)
   */

  /** No reviewers requested → base penalty */
  noReviewerPoints: 40,

  /** PR updated in last N minutes → "freshly pushed, not ready" penalty */
  freshPushMinutes: 30,
  freshPushPoints: 25,

  /** Comments above this threshold → contentious PR penalty */
  highCommentThreshold: 10,
  highCommentPoints: 20,

  /** Review changes requested → still not approved */
  changesRequestedPoints: 35,
} as const;

// ---------------------------------------------------------------------------
// Badge mapping
// ---------------------------------------------------------------------------

export const BADGE_THRESHOLDS: Array<{
  min: number;
  max: number;
  level: RiskLevel;
}> = [
  { min: 0,  max: 20, level: "low" },
  { min: 21, max: 45, level: "medium" },
  { min: 46, max: 70, level: "high" },
  { min: 71, max: 100, level: "critical" },
];

/**
 * Map a numeric score to a RiskLevel badge.
 * @param score - Weighted aggregate score 0–100
 * @returns Corresponding RiskLevel
 */
export function scoreToRiskLevel(score: number): RiskLevel {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  for (const { min, max, level } of BADGE_THRESHOLDS) {
    if (clamped >= min && clamped <= max) return level;
  }
  return "critical";
}

// ---------------------------------------------------------------------------
// Cache config
// ---------------------------------------------------------------------------

export const CACHE_CONFIG = {
  /** TTL for PR list cache in milliseconds (5 minutes) */
  prListTtlMs: 5 * 60 * 1000,
  /** Maximum number of cache entries before eviction */
  maxEntries: 50,
} as const;

// ---------------------------------------------------------------------------
// GitHub API config
// ---------------------------------------------------------------------------

export const GITHUB_CONFIG = {
  apiBase: "https://api.github.com",
  /** Number of PRs to enrich concurrently */
  enrichBatchSize: 5,
  /** Maximum open PRs to fetch */
  maxPRs: 50,
} as const;

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

/**
 * Get the optional server-side GitHub PAT from environment.
 * Returns undefined if not configured.
 */
export function getServerPAT(): string | undefined {
  return process.env.GITHUB_PAT || undefined;
}
