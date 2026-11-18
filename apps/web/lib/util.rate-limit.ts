/**
 * Sliding-window limiter kept in this process's memory. One instance serves
 * the whole store, so a shared store (Redis) is not needed yet.
 * shortcut: counters reset on restart and are per process; use a shared store
 * when the app runs as several replicas.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 5000;

/** True when `key` already used `limit` slots inside the last `windowMs`; otherwise takes one. */
export const isRateLimited = (
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): boolean => {
  const recent = (buckets.get(key) ?? []).filter((at) => now - at < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return true;
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > MAX_KEYS) {
    for (const [name, times] of buckets) {
      if (!times.some((at) => now - at < windowMs)) buckets.delete(name);
    }
  }
  return false;
};

/** Test helper. */
export const resetRateLimits = (): void => buckets.clear();
