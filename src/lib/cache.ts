/**
 * PR Risk Radar — TTL-based In-Memory Cache
 * Auto-evicts entries after their TTL expires.
 * Thread-safe for single-process Node.js server (Next.js).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Generic TTL-based in-memory cache.
 * Entries are evicted lazily on access and eagerly when maxEntries is exceeded.
 */
export class TTLCache<K, V> {
  private readonly store = new Map<K, CacheEntry<V>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  /**
   * @param ttlMs - Time-to-live in milliseconds for each entry
   * @param maxEntries - Maximum number of entries; oldest removed when exceeded
   */
  constructor(ttlMs: number, maxEntries = 100) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  /**
   * Store a value. Overwrites existing entry for the same key.
   * Evicts oldest entry if maxEntries would be exceeded.
   */
  set(key: K, value: V): void {
    // Evict expired entries first
    this.evictExpired();

    // If still at max, remove oldest (first inserted)
    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Retrieve a value. Returns undefined if missing or expired.
   */
  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Remove a specific key.
   */
  delete(key: K): boolean {
    return this.store.delete(key);
  }

  /**
   * Remove all expired entries.
   */
  evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Remove all entries regardless of TTL.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Number of entries currently in cache (includes potentially expired ones).
   * Use evictExpired() before size for accurate count.
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Number of non-expired entries.
   */
  get liveSize(): number {
    this.evictExpired();
    return this.store.size;
  }
}
