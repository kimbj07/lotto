import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type {
  RecommendationRoundSummary,
  RecommendationModeSummary,
  RecommendationSummary,
} from '@/types/lotto'

// This route reads a table the cron rebuilds; it must never be statically
// cached, or /results would freeze on the snapshot captured at build time.
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('recommendation_summary')
    .select('*')
    .order('target_game_no', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rounds = (data as RecommendationRoundSummary[]) ?? []
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
  const { data: modeData, error: modeError } = await supabase
    .from('recommendation_mode_summary')
    .select('*')
  const byMode = modeError ? [] : ((modeData as RecommendationModeSummary[]) ?? [])

  const body: RecommendationSummary = { allTime, rounds, byMode }
  return NextResponse.json(body)
}
