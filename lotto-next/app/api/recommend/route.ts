import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import {
  recommendStats,
  recommendException,
  recommendRandom,
  recommendWithExclusions,
} from '@/lib/recommend'
import type { GameInfo, AppearanceCount } from '@/types/lotto'

// Best-effort recording of a generated recommendation for later grading.
// Uses the service_role client (anon is read-only). Failures are swallowed so
// recording never breaks the recommendation response.
async function recordRecommendation(numbers: number[], mode: string, targetGameNo?: number): Promise<void> {
  try {
    const admin = createAdminClient()
    let target = targetGameNo
    if (target === undefined) {
      const { data: latestRow } = await admin
        .from('game_info')
        .select('game_no')
        .order('game_no', { ascending: false })
        .limit(1)
        .single()
      target = ((latestRow?.game_no as number | undefined) ?? 0) + 1
    }
    const { error } = await admin
      .from('recommendations')
      .insert({ target_game_no: target, mode, numbers })
    if (error) console.error('recordRecommendation failed:', error.message)
  } catch (e) {
    console.error('recordRecommendation threw:', e)
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode = searchParams.get('mode') ?? 'stats'
  const excludeParam = searchParams.get('exclude')

  if (!['stats', 'exception', 'random'].includes(mode)) {
    return NextResponse.json({ error: 'mode must be stats, exception, or random' }, { status: 400 })
  }

  // User-supplied exclusions (comma-separated)
  if (excludeParam) {
    const exclude = excludeParam.split(',').map(Number).filter(n => n >= 1 && n <= 45)
    try {
      const numbers = recommendWithExclusions(exclude)
      await recordRecommendation(numbers, 'custom')
      return NextResponse.json({ numbers })
    } catch (e: unknown) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 })
    }
  }

  if (mode === 'random') {
    const numbers = recommendRandom()
    await recordRecommendation(numbers, 'random')
    return NextResponse.json({ numbers })
  }

  const supabase = createServerClient()

  // Fetch latest game number to build a targeted 10-game range
  const { data: latestRow } = await supabase
    .from('game_info')
    .select('game_no')
    .order('game_no', { ascending: false })
    .limit(1)
    .single()

  const latestNo = latestRow?.game_no ?? 0

  // Fetch last 10 games for stats-based recommendation
  const { data: gamesRaw, error: gamesErr } = await supabase.rpc('get_game_info_in_range', {
    p_from: Math.max(1, latestNo - 9), p_to: latestNo, p_order: 'DESC',
  })
  if (gamesErr) return NextResponse.json({ error: gamesErr.message }, { status: 500 })
  const games = gamesRaw as GameInfo[]

  // Fetch appearance counts sorted by win count DESC
  const { data: countsRaw, error: countsErr } = await supabase.rpc('get_appearance_count', {
    p_from: null, p_to: null,
    p_sort_by: 'winCount', p_sort_order: 'DESC', p_count: null,
  })
  if (countsErr) return NextResponse.json({ error: countsErr.message }, { status: 500 })
  const counts = countsRaw as AppearanceCount[]

  try {
    const numbers = mode === 'exception'
      ? recommendException(games, counts)
      : recommendStats(games, counts)
    await recordRecommendation(numbers, mode, latestNo + 1)
    return NextResponse.json({ numbers })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
