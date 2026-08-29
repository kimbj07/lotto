import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getCached, setCached } from '@/lib/cache'
import { getLatestGameNo } from '@/lib/latestGameNo'
import { serverError } from '@/lib/apiError'
import { WEEKLY_CACHE_CONTROL } from '@/lib/httpCache'
import { analyzePatterns, type DrawBalls } from '@/lib/patterns'
import type { GameInfo, PatternReport } from '@/types/lotto'

// No request param → Next would statically cache this handler at build time.
// Force it dynamic (the in-memory cache below is the intended layer).
export const dynamic = 'force-dynamic'

// The report only changes when the weekly cron adds a draw (that path calls
// clearCache()); the 1h TTL is a backstop.
const CACHE_KEY = 'stats:patterns'
// PostgREST caps any response at the project's Max rows (1000) — including
// RPC results — so the full history is read in chunks under that.
const CHUNK = 900

const CACHE_HEADERS = { 'Cache-Control': WEEKLY_CACHE_CONTROL }

export async function GET() {
  const cached = getCached<PatternReport>(CACHE_KEY)
  if (cached) return NextResponse.json(cached, { headers: CACHE_HEADERS })

  const supabase = createServerClient()
  const latest = await getLatestGameNo(supabase)
  if (!latest.ok) return serverError('patterns.latest', latest.error)

  const draws: DrawBalls[] = []
  for (let from = 1; from <= latest.gameNo; from += CHUNK) {
    const { data, error } = await supabase.rpc('get_game_info_in_range', {
      p_from: from, p_to: Math.min(latest.gameNo, from + CHUNK - 1), p_order: 'ASC',
    })
    if (error) return serverError('patterns', error.message)
    for (const g of ((data as GameInfo[]) ?? [])) {
      draws.push({
        game_no: g.game_no,
        balls: [g.first_ball, g.second_ball, g.third_ball, g.fourth_ball, g.fifth_ball, g.sixth_ball],
        bonus: g.bonus_ball,
      })
    }
  }

  const report = analyzePatterns(draws)
  // Don't make a cold/empty DB sticky for the full TTL.
  if (draws.length > 0) setCached(CACHE_KEY, report)
  return NextResponse.json(report, { headers: CACHE_HEADERS })
}
