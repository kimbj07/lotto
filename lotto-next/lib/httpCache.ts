// CDN cache policy for read routes whose data changes once a week (after the
// Sunday cron). Vercel's edge caches function responses that carry s-maxage,
// shared across all instances and cold starts — something the in-memory
// lib/cache.ts structurally cannot do.
//
// Stated limit: there is NO shared invalidation. The cron cannot purge the
// CDN, so a response may be up to s-maxage stale after a new draw lands. That
// matches the existing 1h in-memory TTL, i.e. this changes cost and latency,
// not freshness. Raise/lower s-maxage with that trade-off in mind.
export const WEEKLY_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400'
