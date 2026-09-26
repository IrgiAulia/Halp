import { computeWeightedScore, scorePR, scoreAllPRs } from "@/lib/scoring";
import type { GitHubPR, SignalResult } from "@/types";
import { SIGNAL_WEIGHTS } from "@/lib/config";

const makeSignal = (
  signal: SignalResult["signal"],
  score: number
): SignalResult => ({
  signal,
  score,
  label: "test",
  details: [],
});

const basePR: GitHubPR = {
  id: 1,
  number: 1,
  title: "Test PR",
  html_url: "https://github.com/owner/repo/pull/1",
  state: "open",
  draft: false,
  user: { login: "user", avatar_url: "", html_url: "" },
  body: null,
  created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10h ago
  updated_at: new Date().toISOString(),
  merged_at: null,
  additions: 100,
  deletions: 50,
  changed_files: 5,
  commits: 2,
  files: [],
  commitList: [],
};

describe("computeWeightedScore", () => {
  it("computes correct weighted sum", () => {
    const signals: SignalResult[] = [
      makeSignal("size", 100),
      makeSignal("ai_generated", 100),
      makeSignal("age", 100),
      makeSignal("hotspot", 100),
    ];
    expect(computeWeightedScore(signals)).toBe(100);
  });

  it("returns 0 when all signals are 0", () => {
    const signals: SignalResult[] = [
      makeSignal("size", 0),
      makeSignal("ai_generated", 0),
      makeSignal("age", 0),
      makeSignal("hotspot", 0),
    ];
    expect(computeWeightedScore(signals)).toBe(0);
  });

  it("applies weights correctly for partial scores", () => {
    const signals: SignalResult[] = [
      makeSignal("size", 100),       // 100 * 0.30 = 30
      makeSignal("ai_generated", 0),  // 0 * 0.25 = 0
      makeSignal("age", 0),           // 0 * 0.25 = 0
      makeSignal("hotspot", 0),       // 0 * 0.20 = 0
    ];
    expect(computeWeightedScore(signals)).toBe(30);
  });
});

describe("scorePR", () => {
  it("returns a ScoringResult with 4 signals", () => {
    const result = scorePR(basePR);
    expect(result.signals).toHaveLength(4);
  });

  it("total score is between 0 and 100", () => {
    const result = scorePR(basePR);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it("riskLevel matches totalScore", () => {
    const result = scorePR(basePR);
    if (result.totalScore <= 25) expect(result.riskLevel).toBe("low");
    else if (result.totalScore <= 50) expect(result.riskLevel).toBe("medium");
    else if (result.totalScore <= 75) expect(result.riskLevel).toBe("high");
    else expect(result.riskLevel).toBe("critical");
  });
});

describe("scoreAllPRs", () => {
  it("processes all PRs and attaches scoring", () => {
    const prs = [basePR, { ...basePR, id: 2, number: 2 }];
    const results = scoreAllPRs(prs);
    expect(results).toHaveLength(2);
    expect(results[0].scoring).toBeDefined();
    expect(results[1].scoring).toBeDefined();
  });

  it("handles an empty array", () => {
    expect(scoreAllPRs([])).toHaveLength(0);
  });
});
