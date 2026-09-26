/**
 * PR Risk Radar — GitHub API Client
 * Uses native fetch, no axios or octokit.
 */

import type {
  GitHubPR,
  PRFile,
  PRCommit,
  RateLimitInfo,
  ConnectResponse,
} from "@/types";
import { GITHUB_CONFIG } from "@/lib/config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitize an owner or repo string — allow only alphanumeric, hyphens, dots, underscores.
 * Prevents path injection / SSRF via crafted owner/repo values.
 * @throws Error if the value contains disallowed characters
 */
export function sanitizeRepoSegment(value: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(
      `Invalid repository segment "${value}". Only alphanumeric, hyphens, dots, and underscores are allowed.`
    );
  }
  return value;
}

/**
 * Parse GitHub rate limit headers from a Response.
 */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    limit: parseInt(headers.get("x-ratelimit-limit") ?? "60", 10),
    remaining: parseInt(headers.get("x-ratelimit-remaining") ?? "0", 10),
    reset: parseInt(headers.get("x-ratelimit-reset") ?? "0", 10),
    used: parseInt(headers.get("x-ratelimit-used") ?? "0", 10),
  };
}

// ---------------------------------------------------------------------------
// GitHub API Client
// ---------------------------------------------------------------------------

/** GitHub API client using native fetch */
export class GitHubClient {
  private readonly pat: string;
  private lastRateLimit: RateLimitInfo | null = null;

  /** @param pat - Personal Access Token for authentication */
  constructor(pat: string) {
    this.pat = pat;
  }

  /** Most recent rate limit info observed from response headers */
  get rateLimit(): RateLimitInfo | null {
    return this.lastRateLimit;
  }

  /**
   * Make an authenticated GET request to the GitHub API.
   * Updates rate limit tracking on every call.
   * @throws Error with a user-safe message on non-2xx responses
   */
  private async get<T>(path: string): Promise<T> {
    const url = `${GITHUB_CONFIG.apiBase}${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    // Track rate limit on every response
    this.lastRateLimit = parseRateLimitHeaders(res.headers);

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("GitHub authentication failed. Check your PAT.");
      }
      if (res.status === 403) {
        throw new Error(
          `GitHub API forbidden. Rate limit remaining: ${this.lastRateLimit.remaining}`
        );
      }
      if (res.status === 404) {
        throw new Error("Repository not found or not accessible with this token.");
      }
      throw new Error(`GitHub API error: ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  /**
   * Validate the PAT and fetch basic repo info.
   * @param owner - Sanitized repository owner
   * @param repo - Sanitized repository name
   */
  async validateConnection(
    owner: string,
    repo: string
  ): Promise<ConnectResponse> {
    const [userResult, repoResult] = await Promise.all([
      this.get<{ login: string }>("/user"),
      this.get<{ full_name: string }>(`/repos/${owner}/${repo}`),
    ]);

    return {
      success: true,
      login: userResult.login,
      repoFullName: repoResult.full_name,
      rateLimit: this.lastRateLimit ?? undefined,
    };
  }

  /**
   * Fetch open pull requests for a repository (up to GITHUB_CONFIG.maxPRs).
   * @param owner - Sanitized repository owner
   * @param repo - Sanitized repository name
   */
  async fetchOpenPRs(owner: string, repo: string): Promise<GitHubPR[]> {
    const prs = await this.get<GitHubPR[]>(
      `/repos/${owner}/${repo}/pulls?state=open&per_page=${GITHUB_CONFIG.maxPRs}&sort=created&direction=desc`
    );
    return prs;
  }

  /**
   * Fetch files changed in a PR.
   * @param owner - Sanitized repository owner
   * @param repo - Sanitized repository name
   * @param prNumber - PR number
   */
  async fetchPRFiles(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<PRFile[]> {
    return this.get<PRFile[]>(
      `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`
    );
  }

  /**
   * Fetch commits in a PR and parse co-author trailers.
   * @param owner - Sanitized repository owner
   * @param repo - Sanitized repository name
   * @param prNumber - PR number
   */
  async fetchPRCommits(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<PRCommit[]> {
    const commits = await this.get<PRCommit[]>(
      `/repos/${owner}/${repo}/pulls/${prNumber}/commits?per_page=100`
    );

    // Parse Co-Authored-By trailers from commit messages
    return commits.map((c) => ({
      ...c,
      coAuthors: parseCoAuthors(c.commit.message),
    }));
  }

  /**
   * Enrich a list of PRs with files and commits.
   * Processes in batches of GITHUB_CONFIG.enrichBatchSize to respect rate limits.
   * @param owner - Sanitized repository owner
   * @param repo - Sanitized repository name
   * @param prs - PRs to enrich
   */
  async enrichPRs(
    owner: string,
    repo: string,
    prs: GitHubPR[]
  ): Promise<GitHubPR[]> {
    const enriched: GitHubPR[] = [];
    const batchSize = GITHUB_CONFIG.enrichBatchSize;

    for (let i = 0; i < prs.length; i += batchSize) {
      const batch = prs.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (pr) => {
          const [files, commitList] = await Promise.all([
            this.fetchPRFiles(owner, repo, pr.number),
            this.fetchPRCommits(owner, repo, pr.number),
          ]);
          return { ...pr, files, commitList };
        })
      );
      enriched.push(...results);
    }

    return enriched;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse "Co-Authored-By:" trailers from a git commit message.
 * @param message - Full commit message body
 * @returns Array of co-author identifiers
 */
export function parseCoAuthors(message: string): string[] {
  const lines = message.split("\n");
  const coAuthors: string[] = [];
  for (const line of lines) {
    const match = line.match(/^Co-Authored-By:\s*(.+)$/i);
    if (match) {
      coAuthors.push(match[1].trim());
    }
  }
  return coAuthors;
}
