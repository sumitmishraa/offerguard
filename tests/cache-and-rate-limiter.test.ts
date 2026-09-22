import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ThreatScanCache } from '../server/security';

describe('ThreatScanCache - Performance & Sub-Millisecond Retrieval', () => {
  it('should store and retrieve cached scan results', () => {
    const cache = new ThreatScanCache<{ threatIndex: number }>(10, 60000);
    const key = 'test-sha256-hash-key';
    const data = { threatIndex: 94 };

    assert.strictEqual(cache.has(key), false);
    cache.set(key, data);

    assert.strictEqual(cache.has(key), true);
    const retrieved = cache.get(key);
    assert.deepStrictEqual(retrieved, data);
  });

  it('should expire stale cache entries according to TTL', async () => {
    const shortTtlCache = new ThreatScanCache<{ status: string }>(10, 50); // 50ms TTL
    const key = 'expiring-key';

    shortTtlCache.set(key, { status: 'active' });
    assert.strictEqual(shortTtlCache.has(key), true);

    // Wait for TTL expiration
    await new Promise(resolve => setTimeout(resolve, 70));

    assert.strictEqual(shortTtlCache.has(key), false);
    assert.strictEqual(shortTtlCache.get(key), null);
  });

  it('should enforce LRU capacity bounds', () => {
    const maxCapacity = 3;
    const lruCache = new ThreatScanCache<number>(maxCapacity, 60000);

    lruCache.set('key-1', 1);
    lruCache.set('key-2', 2);
    lruCache.set('key-3', 3);
    assert.strictEqual(lruCache.size(), 3);

    // Access key-1 to make key-2 the oldest
    lruCache.get('key-1');

    // Add key-4, causing oldest (key-2) to be evicted
    lruCache.set('key-4', 4);
    assert.strictEqual(lruCache.size(), 3);
    assert.strictEqual(lruCache.has('key-2'), false);
    assert.strictEqual(lruCache.has('key-1'), true);
    assert.strictEqual(lruCache.has('key-3'), true);
    assert.strictEqual(lruCache.has('key-4'), true);
  });
});
