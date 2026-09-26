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
  it("returns score 0 for a very fresh PR (below minHours=4)", () => {
    const pr = { ...basePR, created_at: hoursAgo(1) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBe(0);
    expect(result.signal).toBe("age");
  });

  it("returns score 0 at exactly minHours boundary (4h)", () => {
    const pr = { ...basePR, created_at: hoursAgo(4) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBe(0);
  });

  it("returns score 100 at maxHours (72h)", () => {
    const pr = { ...basePR, created_at: hoursAgo(72) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBe(100);
  });

  it("returns score 100 beyond maxHours", () => {
    const pr = { ...basePR, created_at: hoursAgo(200) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBe(100);
  });

  it("returns ~50 for midpoint (~38h)", () => {
    const pr = { ...basePR, created_at: hoursAgo(38) };
    const result = computeAgeSignal(pr);
    expect(result.score).toBeGreaterThanOrEqual(49);
    expect(result.score).toBeLessThanOrEqual(51);
  });

  it("accepts a custom now parameter for deterministic tests", () => {
    const fixedNow = new Date("2024-01-10T12:00:00Z").getTime();
    const pr = {
      ...basePR,
      created_at: new Date("2024-01-08T12:00:00Z").toISOString(), // 48h ago
    };
    const result = computeAgeSignal(pr, fixedNow);
    // (48 - 4) / (72 - 4) * 100 = 44/68 * 100 ≈ 65
    expect(result.score).toBeGreaterThanOrEqual(64);
    expect(result.score).toBeLessThanOrEqual(66);
  });
});
