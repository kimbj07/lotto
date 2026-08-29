import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import {
  recommendStats,
  recommendException,
  recommendRandom,
  recommendTarget5,
} from '@/lib/recommend'
import { isRecommendMode, modeConfig, MODE_KEYS } from '@/lib/recommendModes'
import { getLatestGameNo } from '@/lib/latestGameNo'
import { serverError } from '@/lib/apiError'
import type { GameInfo, AppearanceCount } from '@/types/lotto'

// Response contract (all modes): `games: number[][]` — one entry per game.
// `numbers` mirrors games[0] for single-game modes only (deprecated; kept so
// older clients keep working — remove after one release).
function respond(games: number[][]) {
  return NextResponse.json(games.length === 1 ? { games, numbers: games[0] } : { games })
}

interface RecommendationRow {
  target_game_no: number
  mode: string
  numbers: number[]
  slip_id?: string
}

// Set once per warm instance when the DB reports that `slip_id` doesn't exist
// (migration 008 not applied yet), so the doomed insert isn't retried on
// every request. Resets on cold start, which is when the column may exist.
let slipColumnMissing = false

// Best-effort recording of generated recommendations for later grading.
// Uses the service_role client (anon is read-only). Failures are swallowed so
// recording never breaks the recommendation response.
async function recordRecommendations(rows: Omit<RecommendationRow, 'target_game_no'>[], targetGameNo?: number): Promise<void> {
  try {
    const admin = createAdminClient()
    let target = targetGameNo
    if (target === undefined) {
      // Never fall back to 0: a transient DB error used to record the pick
      // against draw #1 (2002), which then got graded against that draw and
      // sat in /results forever. Skip recording instead.
      const latest = await getLatestGameNo(admin)
      if (!latest.ok) {
        console.error('recordRecommendation skipped (latest game_no unavailable):', latest.error)
        return
      }
      target = latest.gameNo + 1
    }
    const withoutSlip = (r: RecommendationRow) => { const { slip_id: _omit, ...rest } = r; return rest }
    let full: RecommendationRow[] = rows.map(r => ({ ...r, target_game_no: target as number }))
    if (slipColumnMissing) full = full.map(withoutSlip)

    let { error } = await admin.from('recommendations').insert(full)
    // Matches both PostgREST's schema-cache message (PGRST204, what production
    // emits) and the raw Postgres "column ... does not exist".
    if (error && full.some(r => r.slip_id !== undefined) && /slip_id/.test(error.message)) {
      slipColumnMissing = true
      ;({ error } = await admin.from('recommendations').insert(full.map(withoutSlip)))
    }
    if (error) console.error('recordRecommendation failed:', error.message)
  } catch (e) {
    console.error('recordRecommendation threw:', e)
  }
}

async function recordRecommendation(numbers: number[], mode: string, targetGameNo?: number): Promise<void> {
  await recordRecommendations([{ mode, numbers }], targetGameNo)
}

// Strict integer parse: "7abc" and "7.5" are rejected (NaN), not truncated.
function parseNums(p: string | null): number[] {
  if (!p) return []
  return p.split(',').map(s => {
    const n = Number(s.trim())
    return Number.isInteger(n) ? n : NaN
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode = searchParams.get('mode') ?? 'stats'

  if (!isRecommendMode(mode)) {
    return NextResponse.json({ error: `mode must be one of ${MODE_KEYS.join(', ')}` }, { status: 400 })
  }
  const cfg = modeConfig(mode)

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
  const excErr = badSet(exclude, cfg.maxExclude, 'exclude')
  if (excErr) return NextResponse.json({ error: excErr }, { status: 400 })
  if (include.some(n => exclude.includes(n))) {
    return NextResponse.json({ error: 'include and exclude must be disjoint' }, { status: 400 })
  }

  const constraints = { include, exclude }

  // Generators can throw (e.g. an impossible constraint set); keep every path
  // returning `{ error }` JSON rather than an unhandled 500 page.
  try {
    if (mode === 'random') {
      const numbers = recommendRandom(constraints)
      await recordRecommendation(numbers, 'random')
      return respond([numbers])
    }

    if (mode === 'target5') {
      // One slip = 5 games recorded under a shared slip_id, so /results can
      // report the metric this mode optimises: "≥1 game on the slip ranked".
      const games = recommendTarget5(constraints)
      const slipId = randomUUID()
      await recordRecommendations(games.map(numbers => ({ mode: 'target5', numbers, slip_id: slipId })))
      return respond(games)
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  const supabase = createServerClient()

  // Fetch latest game number to build a targeted 10-game range
  const latest = await getLatestGameNo(supabase)
  if (!latest.ok) return serverError('recommend.latest', latest.error, 503)
  const latestNo = latest.gameNo

  // Fetch last 10 games for stats-based recommendation
  const { data: gamesRaw, error: gamesErr } = await supabase.rpc('get_game_info_in_range', {
    p_from: Math.max(1, latestNo - 9), p_to: latestNo, p_order: 'DESC',
  })
  if (gamesErr) return serverError('recommend.games', gamesErr.message)
  const games = gamesRaw as GameInfo[]

  // Fetch appearance counts sorted by win count DESC
  const { data: countsRaw, error: countsErr } = await supabase.rpc('get_appearance_count', {
    p_from: null, p_to: null,
    p_sort_by: 'winCount', p_sort_order: 'DESC', p_count: null,
  })
  if (countsErr) return serverError('recommend.counts', countsErr.message)
  const counts = countsRaw as AppearanceCount[]

  try {
    const numbers = mode === 'exception'
      ? recommendException(games, counts, constraints)
      : recommendStats(games, counts, constraints)
    await recordRecommendation(numbers, mode, latestNo + 1)
    return respond([numbers])
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
