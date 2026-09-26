import {
  sanitizeRepoSegment,
  parseCoAuthors,
  parseRateLimitHeaders,
} from "@/lib/github";

describe("sanitizeRepoSegment", () => {
  it("allows valid repo names", () => {
    expect(sanitizeRepoSegment("my-repo")).toBe("my-repo");
    expect(sanitizeRepoSegment("My_Repo.v2")).toBe("My_Repo.v2");
    expect(sanitizeRepoSegment("org-name")).toBe("org-name");
  });

  it("throws on path traversal attempt", () => {
    expect(() => sanitizeRepoSegment("../etc/passwd")).toThrow();
  });

  it("throws on slash characters", () => {
    expect(() => sanitizeRepoSegment("owner/repo")).toThrow();
  });

  it("throws on null byte injection", () => {
    expect(() => sanitizeRepoSegment("repo\x00evil")).toThrow();
  });

  it("throws on space characters", () => {
    expect(() => sanitizeRepoSegment("my repo")).toThrow();
  });
});

describe("parseCoAuthors", () => {
  it("parses standard co-author trailer", () => {
    const msg = "feat: add thing\n\nCo-Authored-By: GitHub Copilot <copilot@github.com>";
    expect(parseCoAuthors(msg)).toEqual(["GitHub Copilot <copilot@github.com>"]);
  });

  it("parses multiple co-authors", () => {
    const msg =
      "fix: bug\n\nCo-Authored-By: Alice <alice@example.com>\nCo-Authored-By: Bob <bob@example.com>";
    const result = parseCoAuthors(msg);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no co-author trailer", () => {
    expect(parseCoAuthors("regular commit message")).toEqual([]);
  });

  it("is case-insensitive", () => {
    const msg = "feat: x\n\nco-authored-by: Alice <alice@example.com>";
    expect(parseCoAuthors(msg)).toHaveLength(1);
  });
});

describe("parseRateLimitHeaders", () => {
  it("parses all rate limit headers", () => {
    const headers = new Headers({
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "4999",
      "x-ratelimit-reset": "1700000000",
      "x-ratelimit-used": "1",
    });
    const result = parseRateLimitHeaders(headers);
    expect(result.limit).toBe(5000);
    expect(result.remaining).toBe(4999);
    expect(result.reset).toBe(1700000000);
    expect(result.used).toBe(1);
  });

  it("uses defaults when headers are missing", () => {
    const result = parseRateLimitHeaders(new Headers());
    expect(result.limit).toBe(60);
    expect(result.remaining).toBe(0);
  });
});
