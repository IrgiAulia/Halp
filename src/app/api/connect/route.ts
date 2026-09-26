import { NextRequest, NextResponse } from "next/server";
import { GitHubClient, sanitizeRepoSegment } from "@/lib/github";
import type { ConnectRequest } from "@/types";

/** POST /api/connect — Validate GitHub PAT + repo access */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: ConnectRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { pat, owner, repo } = body;

    if (!pat || typeof pat !== "string" || pat.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "GitHub PAT is required." },
        { status: 400 }
      );
    }

    // Sanitize owner and repo to prevent path injection / SSRF
    let safeOwner: string;
    let safeRepo: string;
    try {
      safeOwner = sanitizeRepoSegment(owner);
      safeRepo = sanitizeRepoSegment(repo);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid repository path. Use format: owner/repo",
        },
        { status: 400 }
      );
    }

    const client = new GitHubClient(pat.trim());
    const result = await client.validateConnection(safeOwner, safeRepo);

    return NextResponse.json(result);
  } catch (err) {
    // Do NOT expose stack trace or PAT details in error response
    const message =
      err instanceof Error ? err.message : "Connection failed.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}

/** Reject all non-POST methods */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
