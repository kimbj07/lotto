import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { fetchLatestGameNo, fetchGameInfo } from '@/lib/lotto-api'
import { getLatestGameNo } from '@/lib/latestGameNo'
import { clearCache } from '@/lib/cache'

// Vercel Hobby defaults to a 10s function budget; one draw costs roughly an
// upstream fetch + 4 Supabase round-trips + the 300ms pause (~1.5s), so a
// multi-week catch-up needs more. 60s is the Hobby maximum.
export const maxDuration = 60

// Cap per run so a long outage is caught up over several cron firings rather
// than one run that times out mid-loop (which used to skip grading/refresh).
// Each run makes progress and the next resumes from max(game_no).
const MAX_GAMES_PER_RUN = 10

// Pause between upstream calls so we don't hammer dhlottery during catch-up.
const PAUSE_MS = 300

// Called by Vercel Cron (see vercel.json) and manually via POST /api/sync.
// Protected by CRON_SECRET when called from outside Vercel infra.
async function syncHandler(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  // Fail-closed: if CRON_SECRET is not set, reject all requests
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Writes use the service_role key (server-only); the public anon key has
  // read-only access. Requires SUPABASE_SERVICE_ROLE_KEY in the environment.
  const supabase = createAdminClient()

  // 1. Get latest game number from official site. fetchLatestGameNo throws on
  //    a non-OK / non-JSON / timed-out upstream — that's a 502, not a 500 page.
  let latestGameNo: number
  try {
    latestGameNo = await fetchLatestGameNo()
  } catch (e) {
    console.error('[sync] dhlottery unreachable:', (e as Error).message)
    return NextResponse.json({ error: 'Could not reach dhlottery' }, { status: 502 })
  }
  if (latestGameNo === 0) {
    return NextResponse.json({ error: 'Could not fetch latest game number' }, { status: 502 })
  }

  // 2. Get last saved game number from DB. A DB error here is fatal: falling
  //    back to 0 (the old behaviour) re-fetched every draw since 2002.
  const latest = await getLatestGameNo(supabase)
  if (!latest.ok) {
    console.error('[sync] could not read max(game_no):', latest.error)
    return NextResponse.json({ error: 'Could not read last saved draw' }, { status: 500 })
  }
  const lastSavedGameNo = latest.gameNo

  let synced = 0
  let skipped = 0
  const errors: string[] = []
  const upTo = Math.min(latestGameNo, lastSavedGameNo + MAX_GAMES_PER_RUN)

  // 3. Insert each missing game, IN ORDER, and stop at the first failure.
  //    Continuing past a failed draw used to orphan it permanently: the next
  //    run resumes from max(game_no), so a skipped draw was never retried —
  //    a hole in /history and picks targeting it never graded.
  for (let gameNo = lastSavedGameNo + 1; gameNo <= upTo; gameNo++) {
    let gameInfo
    try {
      gameInfo = await fetchGameInfo(gameNo)
    } catch (e) {
      errors.push(`fetch ${gameNo}: ${(e as Error).message}`)
      skipped++
      break
    }

    // Insert game_info row
    const { error: giError } = await supabase.from('game_info').insert({
      game_no: gameInfo.game_no,
      game_date: gameInfo.game_date,
      first_winner_amount: gameInfo.first_winner_amount,
      first_winner_count: gameInfo.first_winner_count,
      total_first_winner_amount: gameInfo.total_first_winner_amount,
      second_winner_amount: gameInfo.second_winner_amount,
      second_winner_count: gameInfo.second_winner_count,
      total_second_winner_amount: gameInfo.total_second_winner_amount,
      third_winner_amount: gameInfo.third_winner_amount,
      third_winner_count: gameInfo.third_winner_count,
      total_third_winner_amount: gameInfo.total_third_winner_amount,
      fourth_winner_amount: gameInfo.fourth_winner_amount,
      fourth_winner_count: gameInfo.fourth_winner_count,
      total_fourth_winner_amount: gameInfo.total_fourth_winner_amount,
      fifth_winner_amount: gameInfo.fifth_winner_amount,
      fifth_winner_count: gameInfo.fifth_winner_count,
      total_fifth_winner_amount: gameInfo.total_fifth_winner_amount,
      total_winner_count: gameInfo.total_winner_count,
      total_amount: gameInfo.total_amount,
      total_sell_amount: gameInfo.total_sell_amount,
      manual_winner_count: gameInfo.manual_winner_count,
      auto_winner_count: gameInfo.auto_winner_count,
    })
    if (giError) {
      errors.push(`game_info ${gameNo}: ${giError.message}`)
      skipped++
      break
    }

    // Insert 6 win_numbers rows
    const balls = [
      gameInfo.first_ball, gameInfo.second_ball, gameInfo.third_ball,
      gameInfo.fourth_ball, gameInfo.fifth_ball, gameInfo.sixth_ball,
    ]
    const { error: wnError } = await supabase.from('win_numbers').insert(
      balls.map((number, i) => ({ game_no: gameInfo.game_no, number, sequence: i + 1 }))
    )
    if (wnError) {
      await rollback(supabase, gameNo, errors)
      errors.push(`win_numbers ${gameNo}: ${wnError.message}`)
      skipped++
      break
    }

    // Insert bonus_number row
    const { error: bnError } = await supabase.from('bonus_number').insert({
      game_no: gameInfo.game_no,
      number: gameInfo.bonus_ball,
    })
    if (bnError) {
      await rollback(supabase, gameNo, errors)
      errors.push(`bonus_number ${gameNo}: ${bnError.message}`)
      skipped++
      break
    }

    synced++

    // Grade any recommendations that targeted this now-drawn round.
    const { error: gradeErr } = await supabase.rpc('grade_recommendations', { p_game_no: gameInfo.game_no })
    if (gradeErr) errors.push(`grade_recommendations ${gameNo}: ${gradeErr.message}`)

    // Brief pause to avoid hammering the official API
    await new Promise(r => setTimeout(r, PAUSE_MS))
  }

  // New draws landed. Self-healing: grade any drawn-round picks that missed their
  // one-shot grade (e.g. inserted during this run's grading window), then rebuild
  // the summary tables. RPC errors are reported, not swallowed — a failed
  // refresh used to look like a successful run while /results silently froze.
  if (synced > 0) {
    const { error: pendErr } = await supabase.rpc('grade_pending_recommendations')
    if (pendErr) errors.push(`grade_pending_recommendations: ${pendErr.message}`)
    const { error: refreshErr } = await supabase.rpc('refresh_recommendation_summary')
    if (refreshErr) errors.push(`refresh_recommendation_summary: ${refreshErr.message}`)
    // Evict caches (history "latest N" + the results summary) only AFTER the
    // tables are fresh, so a request landing mid-refresh can't re-prime the
    // summary cache with stale data. Best-effort per warm instance; other
    // instances self-heal within the TTL.
    clearCache()
  }

  if (errors.length) console.error('[sync] completed with errors:', errors)
  return NextResponse.json({
    synced, skipped, latestGameNo, lastSavedGameNo,
    remaining: Math.max(0, latestGameNo - (lastSavedGameNo + synced)),
    ...(errors.length ? { errors } : {}),
  })
}

// Compensating delete for a half-inserted draw (game_info without children).
// Its own failure is recorded too: a leftover parent row renders as a `0`
// ball on /history, so it must not go unnoticed.
async function rollback(
  supabase: ReturnType<typeof createAdminClient>, gameNo: number, errors: string[]
) {
  const { error } = await supabase.from('game_info').delete().eq('game_no', gameNo)
  if (error) errors.push(`rollback ${gameNo}: ${error.message}`)
}

// Vercel Cron Jobs send GET requests; manual calls use POST
export const GET = syncHandler
export const POST = syncHandler
