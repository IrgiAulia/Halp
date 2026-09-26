import { computeHotspotSignal } from "@/lib/signals/hotspot";
import type { GitHubPR, PRFile } from "@/types";

const basePR: GitHubPR = {
  id: 1,
  number: 1,
  title: "Test PR",
  html_url: "https://github.com/owner/repo/pull/1",
  state: "open",
  draft: false,
  user: { login: "user", avatar_url: "", html_url: "" },
  body: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  merged_at: null,
  additions: 10,
  deletions: 5,
  changed_files: 1,
  commits: 1,
  files: [],
};

const makeFile = (filename: string): PRFile => ({
  filename,
  additions: 5,
  deletions: 2,
  changes: 7,
  status: "modified",
});

describe("computeHotspotSignal", () => {
  it("returns score 0 for safe files with no overlap", () => {
    const pr = { ...basePR, files: [makeFile("src/components/Button.tsx")] };
    const result = computeHotspotSignal(pr);
    expect(result.score).toBe(0);
    expect(result.signal).toBe("hotspot");
  });

  it("scores risky /auth/ path", () => {
    const pr = { ...basePR, files: [makeFile("src/auth/login.ts")] };
    const result = computeHotspotSignal(pr);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it("scores risky /payment/ path", () => {
    const pr = { ...basePR, files: [makeFile("src/payment/checkout.ts")] };
    const result = computeHotspotSignal(pr);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it("scores risky /admin/ path", () => {
    const pr = { ...basePR, files: [makeFile("app/admin/users.ts")] };
    const result = computeHotspotSignal(pr);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it("scores risky /config/ path", () => {
    const pr = { ...basePR, files: [makeFile("src/config/database.ts")] };
    const result = computeHotspotSignal(pr);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it("scores .env file", () => {
    const pr = { ...basePR, files: [makeFile(".env.production")] };
    const result = computeHotspotSignal(pr);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it("adds cross-PR overlap score", () => {
    const pr = { ...basePR, files: [makeFile("src/components/Button.tsx")] };
    const otherPRFiles = [["src/components/Button.tsx"]]; // same file in another PR
    const result = computeHotspotSignal(pr, otherPRFiles);
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("does not exceed 100", () => {
    const riskyFiles = Array.from({ length: 10 }, (_, i) =>
      makeFile(`src/auth/handler${i}.ts`)
    );
    const pr = { ...basePR, files: riskyFiles };
    const overlapFiles = [riskyFiles.map((f) => f.filename)];
    const result = computeHotspotSignal(pr, overlapFiles);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("handles PR with no files", () => {
    const pr = { ...basePR, files: [] };
    const result = computeHotspotSignal(pr);
    expect(result.score).toBe(0);
  });

  it("handles PR with undefined files", () => {
    const pr = { ...basePR };
    delete (pr as Partial<GitHubPR>).files;
    const result = computeHotspotSignal(pr);
    expect(result.score).toBe(0);
  });
});
