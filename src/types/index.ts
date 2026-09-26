/**
 * PR Risk Radar — Type Contracts
 * Single source of truth between frontend ↔ backend
 */

// ---------------------------------------------------------------------------
// GitHub API shapes
// ---------------------------------------------------------------------------

/** A GitHub user object as returned by the API */
export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

/** A single file changed in a PR */
export interface PRFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: "added" | "modified" | "removed" | "renamed" | "copied";
}

/** A single commit in a PR */
export interface PRCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: GitHubUser | null;
  /** Co-authors parsed from commit trailer lines */
  coAuthors?: string[];
}

/** Raw PR data from GitHub API */
export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed" | "merged";
  draft: boolean;
  user: GitHubUser;
  body: string | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
  /** Number of issue/PR comments */
  comments?: number;
  /** Number of review-specific comments */
  review_comments?: number;
  /** Requested reviewer logins (populated after enrichment) */
  requested_reviewers?: GitHubUser[];
  /** Populated after enrichment */
  files?: PRFile[];
  /** Populated after enrichment */
  commitList?: PRCommit[];
  /** Review states from the PR reviews endpoint (e.g. APPROVED, CHANGES_REQUESTED) */
  reviewStates?: string[];
}

// ---------------------------------------------------------------------------
// Risk scoring
// ---------------------------------------------------------------------------

/** Possible risk badge values */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Result from a single risk signal computation */
export interface SignalResult {
  /** Signal identifier */
  signal: "size" | "ai_generated" | "age" | "hotspot" | "commit_complexity" | "review_velocity";
  /** Normalized score 0-100 */
  score: number;
  /** Human-readable explanation */
  label: string;
  /** Detailed breakdown for tooltip */
  details: string[];
}

/** Full scoring result for a PR */
export interface ScoringResult {
  /** Weighted aggregate score 0-100 */
  totalScore: number;
  /** Badge derived from totalScore */
  riskLevel: RiskLevel;
  /** Per-signal breakdown */
  signals: SignalResult[];
}

/** A PR enriched with risk scoring */
export interface ScoredPR extends GitHubPR {
  scoring: ScoringResult;
}

// ---------------------------------------------------------------------------
// API request/response shapes
// ---------------------------------------------------------------------------

/** POST /api/connect request body */
export interface ConnectRequest {
  /** GitHub Personal Access Token */
  pat: string;
  /** Repository owner (user or org) */
  owner: string;
  /** Repository name */
  repo: string;
}

/** POST /api/connect response */
export interface ConnectResponse {
  success: boolean;
  /** Authenticated GitHub username */
  login?: string;
  /** Repository full name */
  repoFullName?: string;
  /** Remaining GitHub API rate limit */
  rateLimit?: RateLimitInfo;
  error?: string;
}

/** GET /api/prs query params */
export interface PRsQueryParams {
  owner: string;
  repo: string;
  /** Bearer token — PAT passed via Authorization header */
}

/** GET /api/prs response */
export interface PRsResponse {
  prs: ScoredPR[];
  rateLimit: RateLimitInfo;
  /** Whether results came from cache */
  cached: boolean;
  /** ISO timestamp of the data */
  fetchedAt: string;
}

/** GET /api/health response */
export interface HealthResponse {
  status: "ok";
  rateLimit?: RateLimitInfo;
  cacheSize: number;
  uptime: number;
}

/** GitHub rate limit information */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  used: number;
}

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------

/** Current connection state in the UI */
export interface ConnectionState {
  isConnected: boolean;
  owner: string;
  repo: string;
  login?: string;
  /** PAT stored in memory only, never persisted */
  pat?: string;
}

/** Filter and sort options for the PR list */
export interface PRListOptions {
  filterRisk: RiskLevel | "all";
  sortBy: "score" | "age" | "size" | "number";
  sortDir: "asc" | "desc";
}

/** Summary statistics for StatsBar */
export interface PRStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  averageScore: number;
}
