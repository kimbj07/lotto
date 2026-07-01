import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getCached, setCached } from '@/lib/cache'
import type {
  RecommendationRoundSummary,
  RecommendationModeSummary,
  RecommendationSummary,
} from '@/types/lotto'

// Never statically cached — reads tables the cron rebuilds. The in-memory cache
// below (lib/cache.ts) is a separate, cron-evicted layer, NOT Next's fetch Data
// Cache (which previously froze /results on a stale snapshot).
export const dynamic = 'force-dynamic'

// The summary only changes when the weekly cron rebuilds it (that path calls
// clearCache()); the 1h TTL is a backstop. Caching the computed body lets warm
// requests skip the two live Supabase round-trips entirely.
const CACHE_KEY = 'recommendations:summary'

export async function GET() {
  const cached = getCached<RecommendationSummary>(CACHE_KEY)
  if (cached) return NextResponse.json(cached)

  const supabase = createServerClient()
  // Both reads hit pre-materialized summary tables; run them concurrently.
  const [summaryRes, modeRes] = await Promise.all([
    supabase.from('recommendation_summary').select('*').order('target_game_no', { ascending: false }),
    supabase.from('recommendation_mode_summary').select('*'),
  ])

  if (summaryRes.error) return NextResponse.json({ error: summaryRes.error.message }, { status: 500 })

  const rounds = (summaryRes.data as RecommendationRoundSummary[]) ?? []
  const allTime = rounds.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      graded_count: acc.graded_count + r.graded_count,
      rank1: acc.rank1 + r.rank1,
      rank2: acc.rank2 + r.rank2,
      rank3: acc.rank3 + r.rank3,
      rank4: acc.rank4 + r.rank4,
      rank5: acc.rank5 + r.rank5,
    }),
    { total: 0, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 }
  )

  // All-time per-mode breakdown. Degrade gracefully: if this table is missing
  // (migration 007 not yet applied) or the query fails, still serve the rest.
  const byMode = modeRes.error ? [] : ((modeRes.data as RecommendationModeSummary[]) ?? [])

  const body: RecommendationSummary = { allTime, rounds, byMode }
  setCached(CACHE_KEY, body)
  return NextResponse.json(body)
}
