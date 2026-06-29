import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  recommendStats,
  recommendException,
  recommendRandom,
  recommendWithExclusions,
} from '@/lib/recommend'
import type { GameInfo, AppearanceCount } from '@/types/lotto'

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
      return NextResponse.json({ numbers: recommendWithExclusions(exclude) })
    } catch (e: unknown) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 })
    }
  }

  if (mode === 'random') {
    return NextResponse.json({ numbers: recommendRandom() })
  }

  const supabase = createServerClient()

  // Fetch last 10 games for stats-based recommendation
  const { data: gamesRaw, error: gamesErr } = await supabase.rpc('get_game_info_in_range', {
    p_from: null, p_to: null, p_order: 'DESC',
  })
  if (gamesErr) return NextResponse.json({ error: gamesErr.message }, { status: 500 })
  const games = (gamesRaw as GameInfo[]).slice(0, 10)

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
    return NextResponse.json({ numbers })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
