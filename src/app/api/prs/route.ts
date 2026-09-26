import { NextRequest, NextResponse } from "next/server";
import { GitHubClient, sanitizeRepoSegment } from "@/lib/github";
import { scoreAllPRs } from "@/lib/scoring";
import { TTLCache } from "@/lib/cache";
import { CACHE_CONFIG, getServerPAT } from "@/lib/config";
import type { PRsResponse } from "@/types";

// Module-level cache — persists across requests in same Node process
const prCache = new TTLCache<string, PRsResponse>(CACHE_CONFIG.prListTtlMs, CACHE_CONFIG.maxEntries);

/** GET /api/prs?owner=<owner>&repo=<repo> — Fetch and score open PRs */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const ownerRaw = searchParams.get("owner");
    const repoRaw = searchParams.get("repo");

    if (!ownerRaw || !repoRaw) {
      return NextResponse.json(
        { error: "owner and repo query parameters are required." },
        { status: 400 }
      );
    }

    // Sanitize path segments
    let owner: string;
    let repo: string;
    try {
      owner = sanitizeRepoSegment(ownerRaw);
      repo = sanitizeRepoSegment(repoRaw);
    } catch {
      return NextResponse.json(
        { error: "Invalid owner or repo format." },
        { status: 400 }
      );
    }

    // PAT from Authorization header, fallback to server-side env PAT
    const authHeader = req.headers.get("authorization");
    const pat = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : getServerPAT();

    if (!pat) {
      return NextResponse.json(
        { error: "No GitHub PAT provided. Pass via Authorization: Bearer <token> header." },
        { status: 401 }
      );
    }

    const cacheKey = `${owner}/${repo}`;
    const cached = prCache.get(cacheKey);

    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // Fetch, enrich, and score
    const client = new GitHubClient(pat);
    const rawPRs = await client.fetchOpenPRs(owner, repo);
    const enrichedPRs = await client.enrichPRs(owner, repo, rawPRs);
    const scoredPRs = scoreAllPRs(enrichedPRs);

    const response: PRsResponse = {
      prs: scoredPRs,
      rateLimit: client.rateLimit ?? {
        limit: 60,
        remaining: 0,
        reset: 0,
        used: 0,
      },
      cached: false,
      fetchedAt: new Date().toISOString(),
    };

    prCache.set(cacheKey, response);

    return NextResponse.json(response);
  } catch (err) {
    // Do NOT expose internal details or stack traces
    const message =
      err instanceof Error ? err.message : "Failed to fetch pull requests.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Reject all non-GET methods */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
