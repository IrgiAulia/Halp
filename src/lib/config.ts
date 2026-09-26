/**
 * PR Risk Radar — Configuration
 * All scoring weights and thresholds live here.
 * Tune numbers here, not in signal code.
 */

import type { RiskLevel } from "@/types";

// ---------------------------------------------------------------------------
// Signal weights (must sum to 1.0)
// ---------------------------------------------------------------------------

export const SIGNAL_WEIGHTS = {
  size: 0.30,
  ai_generated: 0.25,
  age: 0.25,
  hotspot: 0.20,
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
  minLines: 50,
  /** Lines changed above this → score 100 */
  maxLines: 1000,
  /** Files changed above this → bonus score added */
  manyFilesThreshold: 20,
  /** Bonus points for exceeding manyFilesThreshold */
  manyFilesBonus: 15,
} as const;

// ---------------------------------------------------------------------------
// AI-generated signal thresholds
// ---------------------------------------------------------------------------

export const AI_CONFIG = {
  /** Points awarded when co-author trailer is detected */
  coAuthorPoints: 50,
  /** Points awarded when commit burst pattern detected */
  commitBurstPoints: 30,
  /** Minutes threshold for "suspiciously fast" commit burst */
  commitBurstMinutes: 10,
  /** Minimum commits in burst window to trigger */
  commitBurstMin: 3,
  /** Points awarded for addition/deletion ratio anomaly */
  ratioAnomalyPoints: 20,
  /** Ratio of additions to deletions above which anomaly is flagged */
  ratioAnomalyThreshold: 20,
  /** AI co-author patterns to detect */
  coAuthorPatterns: [
    /co-authored-by:.*github-actions/i,
    /co-authored-by:.*copilot/i,
    /co-authored-by:.*bot/i,
    /generated.by.*(claude|gpt|gemini|copilot|cursor)/i,
  ],
} as const;

// ---------------------------------------------------------------------------
// Age signal thresholds
// ---------------------------------------------------------------------------

export const AGE_CONFIG = {
  /** Hours old below this → score 0 */
  minHours: 4,
  /** Hours old above this → score 100 */
  maxHours: 72,
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
    /\.env/i,
    /migration/i,
    /schema\.(ts|js|sql)/i,
  ],
  /** Points per risky file (capped at 100) */
  pointsPerRiskyFile: 20,
  /** Points per cross-PR file overlap */
  pointsPerOverlap: 10,
  /** Maximum overlap bonus */
  maxOverlapBonus: 40,
} as const;

// ---------------------------------------------------------------------------
// Badge mapping
// ---------------------------------------------------------------------------

export const BADGE_THRESHOLDS: Array<{
  min: number;
  max: number;
  level: RiskLevel;
}> = [
  { min: 0, max: 25, level: "low" },
  { min: 26, max: 50, level: "medium" },
  { min: 51, max: 75, level: "high" },
  { min: 76, max: 100, level: "critical" },
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
