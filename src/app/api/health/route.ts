import { NextResponse } from "next/server";
import type { HealthResponse } from "@/types";

const startTime = Date.now();

/** GET /api/health — Health check + rate limit status */
export async function GET(): Promise<NextResponse> {
  const response: HealthResponse = {
    status: "ok",
    cacheSize: 0, // cache is module-level in prs/route.ts; report 0 here
    uptime: Math.round((Date.now() - startTime) / 1000),
  };

  return NextResponse.json(response);
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
