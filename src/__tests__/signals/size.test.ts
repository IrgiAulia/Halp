import { computeSizeSignal } from "@/lib/signals/size";
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
  additions: 0,
  deletions: 0,
  changed_files: 1,
  commits: 1,
};

describe("computeSizeSignal", () => {
  it("returns score 0 for very small PR (below minLines)", () => {
    const pr = { ...basePR, additions: 20, deletions: 10 }; // 30 lines, below 50
    const result = computeSizeSignal(pr);
    expect(result.score).toBe(0);
    expect(result.signal).toBe("size");
  });

  it("returns score 0 at exactly minLines boundary", () => {
    const pr = { ...basePR, additions: 30, deletions: 20 }; // 50 lines = minLines
    const result = computeSizeSignal(pr);
    expect(result.score).toBe(0);
  });

  it("returns score 100 at maxLines (1000 lines)", () => {
    const pr = { ...basePR, additions: 600, deletions: 400 }; // 1000 lines
    const result = computeSizeSignal(pr);
    expect(result.score).toBe(100);
  });

  it("returns score 100 above maxLines", () => {
    const pr = { ...basePR, additions: 800, deletions: 500 }; // 1300 lines
    const result = computeSizeSignal(pr);
    expect(result.score).toBe(100);
  });

  it("returns ~50 for midpoint (525 lines)", () => {
    const pr = { ...basePR, additions: 300, deletions: 225 }; // 525 lines
    const result = computeSizeSignal(pr);
    expect(result.score).toBeGreaterThanOrEqual(49);
    expect(result.score).toBeLessThanOrEqual(51);
  });

  it("adds file count bonus when changed_files > 20", () => {
    const pr = { ...basePR, additions: 50, deletions: 50, changed_files: 21 }; // 100 lines + bonus
    const withBonus = computeSizeSignal(pr);
    const noBonus = computeSizeSignal({ ...pr, changed_files: 5 });
    expect(withBonus.score).toBeGreaterThan(noBonus.score);
  });

  it("does not exceed 100 even with bonus", () => {
    const pr = { ...basePR, additions: 700, deletions: 400, changed_files: 25 };
    const result = computeSizeSignal(pr);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns score 0 for zero lines", () => {
    const pr = { ...basePR, additions: 0, deletions: 0 };
    const result = computeSizeSignal(pr);
    expect(result.score).toBe(0);
  });
});
