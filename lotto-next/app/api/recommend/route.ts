import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import {
  recommendStats,
  recommendException,
  recommendRandom,
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

  if (!['stats', 'exception', 'random'].includes(mode)) {
    return NextResponse.json({ error: 'mode must be stats, exception, or random' }, { status: 400 })
  }

  const parseNums = (p: string | null): number[] =>
    p ? p.split(',').map(s => parseInt(s, 10)) : []
  const include = parseNums(searchParams.get('include'))
  const exclude = parseNums(searchParams.get('exclude'))

  const badSet = (nums: number[], max: number, name: string): string | null => {
    if (nums.some(n => isNaN(n) || n < 1 || n > 45)) return `${name} numbers must be between 1 and 45`
    if (new Set(nums).size !== nums.length) return `${name} numbers must be unique`
    if (nums.length > max) return `at most ${max} ${name} numbers allowed`
    return null
  }
  const incErr = badSet(include, 5, 'include')
  if (incErr) return NextResponse.json({ error: incErr }, { status: 400 })
  const excErr = badSet(exclude, 38, 'exclude')
  if (excErr) return NextResponse.json({ error: excErr }, { status: 400 })
  if (include.some(n => exclude.includes(n))) {
    return NextResponse.json({ error: 'include and exclude must be disjoint' }, { status: 400 })
  }

  const constraints = { include, exclude }

  if (mode === 'random') {
    const numbers = recommendRandom(constraints)
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
      ? recommendException(games, counts, constraints)
      : recommendStats(games, counts, constraints)
    await recordRecommendation(numbers, mode, latestNo + 1)
    return NextResponse.json({ numbers })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
