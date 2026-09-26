import { computeAgeSignal } from "@/lib/signals/age";
import type { GitHubPR } from "@/types";

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
};

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

describe("computeAgeSignal", () => {
  it("returns score 0 for a very fresh PR (below minHours=2)", () => {
    const pr = { ...basePR, created_at: hoursAgo(1) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBe(0);
    expect(result.signal).toBe("age");
  });

  it("returns score 0 at exactly minHours boundary (2h)", () => {
    const pr = { ...basePR, created_at: hoursAgo(2) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBe(0);
  });

  it("returns score 100 at maxHours (48h)", () => {
    const pr = { ...basePR, created_at: hoursAgo(48) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBe(100);
  });

  it("returns score 100 beyond maxHours", () => {
    const pr = { ...basePR, created_at: hoursAgo(200) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBe(100);
  });

  it("returns ~50 for midpoint (~25h)", () => {
    const pr = { ...basePR, created_at: hoursAgo(25) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBeGreaterThanOrEqual(49);
    expect(result.score).toBeLessThanOrEqual(51);
  });

  it("accepts a custom now parameter for deterministic tests", () => {
    const fixedNow = new Date("2024-01-10T12:00:00Z").getTime();
    const pr = {
      ...basePR,
      created_at: new Date("2024-01-09T12:00:00Z").toISOString(), // 24h ago
    };
    const result = computeAgeSignal(pr, fixedNow);
    // (24 - 2) / (48 - 2) * 100 = 22/46 * 100 ≈ 48
    expect(result.score).toBeGreaterThanOrEqual(47);
    expect(result.score).toBeLessThanOrEqual(49);
  });
});
