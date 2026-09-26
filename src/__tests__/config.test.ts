import { SIGNAL_WEIGHTS, scoreToRiskLevel, BADGE_THRESHOLDS } from "@/lib/config";

describe("config", () => {
  describe("SIGNAL_WEIGHTS", () => {
    it("weights sum to 1.0", () => {
      const sum = Object.values(SIGNAL_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 3);
    });

    it("has exactly 4 signals", () => {
      expect(Object.keys(SIGNAL_WEIGHTS)).toHaveLength(4);
    });

    it("size weight is 0.30", () => {
      expect(SIGNAL_WEIGHTS.size).toBe(0.30);
    });

    it("ai_generated weight is 0.25", () => {
      expect(SIGNAL_WEIGHTS.ai_generated).toBe(0.25);
    });

    it("age weight is 0.25", () => {
      expect(SIGNAL_WEIGHTS.age).toBe(0.25);
    });

    it("hotspot weight is 0.20", () => {
      expect(SIGNAL_WEIGHTS.hotspot).toBe(0.20);
    });
  });

  describe("scoreToRiskLevel", () => {
    it.each([
      [0, "low"],
      [25, "low"],
      [26, "medium"],
      [50, "medium"],
      [51, "high"],
      [75, "high"],
      [76, "critical"],
      [100, "critical"],
    ])("score %i → %s", (score, expected) => {
      expect(scoreToRiskLevel(score)).toBe(expected);
    });

    it("clamps negative scores to low", () => {
      expect(scoreToRiskLevel(-10)).toBe("low");
    });

    it("clamps scores above 100 to critical", () => {
      expect(scoreToRiskLevel(110)).toBe("critical");
    });
  });

  describe("BADGE_THRESHOLDS", () => {
    it("covers full 0-100 range without gaps", () => {
      const sorted = [...BADGE_THRESHOLDS].sort((a, b) => a.min - b.min);
      expect(sorted[0].min).toBe(0);
      expect(sorted[sorted.length - 1].max).toBe(100);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].min).toBe(sorted[i - 1].max + 1);
      }
    });
  });
});
