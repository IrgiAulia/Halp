import { TTLCache } from "@/lib/cache";

describe("TTLCache", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("set and get", () => {
    it("stores and retrieves a value", () => {
      const cache = new TTLCache<string, number>(5000);
      cache.set("a", 42);
      expect(cache.get("a")).toBe(42);
    });

    it("returns undefined for missing key", () => {
      const cache = new TTLCache<string, number>(5000);
      expect(cache.get("missing")).toBeUndefined();
    });

    it("overwrites existing entry", () => {
      const cache = new TTLCache<string, number>(5000);
      cache.set("a", 1);
      cache.set("a", 2);
      expect(cache.get("a")).toBe(2);
    });
  });

  describe("TTL expiry", () => {
    it("returns value before TTL expires", () => {
      const cache = new TTLCache<string, string>(5000);
      cache.set("key", "value");
      jest.advanceTimersByTime(4999);
      expect(cache.get("key")).toBe("value");
    });

    it("returns undefined after TTL expires", () => {
      const cache = new TTLCache<string, string>(5000);
      cache.set("key", "value");
      jest.advanceTimersByTime(5001);
      expect(cache.get("key")).toBeUndefined();
    });

    it("removes expired entry from store on get", () => {
      const cache = new TTLCache<string, string>(5000);
      cache.set("key", "value");
      jest.advanceTimersByTime(5001);
      cache.get("key");
      expect(cache.size).toBe(0);
    });
  });

  describe("evictExpired", () => {
    it("removes only expired entries", () => {
      const cache = new TTLCache<string, number>(5000);
      cache.set("a", 1);
      jest.advanceTimersByTime(3000);
      cache.set("b", 2); // fresh
      jest.advanceTimersByTime(2001); // "a" now expired, "b" still valid
      cache.evictExpired();
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe(2);
    });
  });

  describe("maxEntries eviction", () => {
    it("evicts oldest entry when maxEntries exceeded", () => {
      const cache = new TTLCache<string, number>(60000, 3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      cache.set("d", 4); // should evict "a"
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe(2);
      expect(cache.get("c")).toBe(3);
      expect(cache.get("d")).toBe(4);
    });
  });

  describe("has and delete", () => {
    it("has returns true for live entry", () => {
      const cache = new TTLCache<string, number>(5000);
      cache.set("x", 99);
      expect(cache.has("x")).toBe(true);
    });

    it("has returns false after TTL expires", () => {
      const cache = new TTLCache<string, number>(5000);
      cache.set("x", 99);
      jest.advanceTimersByTime(5001);
      expect(cache.has("x")).toBe(false);
    });

    it("delete removes entry", () => {
      const cache = new TTLCache<string, number>(5000);
      cache.set("x", 99);
      cache.delete("x");
      expect(cache.get("x")).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("removes all entries", () => {
      const cache = new TTLCache<string, number>(5000);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe("liveSize", () => {
    it("counts only non-expired entries", () => {
      const cache = new TTLCache<string, number>(5000);
      cache.set("a", 1);
      cache.set("b", 2);
      jest.advanceTimersByTime(5001);
      cache.set("c", 3); // fresh
      expect(cache.liveSize).toBe(1);
    });
  });
});
