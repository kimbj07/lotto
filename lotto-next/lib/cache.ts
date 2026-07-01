// Minimal in-memory (local) cache with per-entry TTL.
//
// SERVERLESS CAVEAT: this Map lives in a single warm lambda instance's module
// scope. It is NOT shared across instances and does NOT survive a cold start.
// That is intentional here — we explicitly want a local cache, not a remote one.
// Because of this, `clearCache()` (called by the cron sync) only evicts the
// instance that served the cron request; other warm instances self-heal within
// the TTL. Correctness is therefore bounded by the TTL, never by eviction.

type Entry = { value: unknown; expires: number }

const store = new Map<string, Entry>()

const DEFAULT_TTL_MS = 60 * 60 * 1000 // 1 hour

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() >= entry.expires) {
    store.delete(key) // lazy expiry
    return undefined
  }
  return entry.value as T
}

export function setCached<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  store.set(key, { value, expires: Date.now() + ttlMs })
}

// Best-effort, same-instance-only eviction (see serverless caveat above).
// Correctness does not depend on this call — the TTL is the real staleness bound.
export function clearCache(): void {
  store.clear()
}

// Test helper: number of live-or-not entries currently held.
export function cacheSize(): number {
  return store.size
}
