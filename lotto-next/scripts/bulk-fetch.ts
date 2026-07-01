/**
 * One-time bulk seed: fetch all historical draws from dhlottery.co.kr
 * straight into Supabase. Runs locally (no serverless timeout), so it can
 * fetch the full ~1,180-draw history in one go. After this, the weekly
 * Vercel cron only ever fetches the single new draw each week.
 *
 * Reuses the tested fetch/parse logic from lib/lotto-api.ts and mirrors the
 * insert sequence of app/api/sync/route.ts (game_info -> win_numbers ->
 * bonus_number, with orphan cleanup on failure).
 *
 * Resumable: reads the highest game_no already in the DB and continues from
 * there, so it is safe to re-run after an interruption.
 *
 * Run with:
 *   node --env-file=.env.local scripts/bulk-fetch.ts
 * or:
 *   npm run seed
 *
 * Required env vars (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL       - your project URL
 *   SUPABASE_SERVICE_ROLE_KEY      - service_role secret key (bypasses RLS;
 *                                    NEVER commit or expose to the browser)
 */
import { createClient } from '@supabase/supabase-js'
import type { GameInfo } from '../types/lotto'
import { fetchLatestGameNo, fetchGameInfoWindow } from '../lib/lotto-api'

const THROTTLE_MS = 250 // pause between official-site fetches
const WINDOW = 10 // draws returned per selectPstLt645InfoNew.do call

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local\n' +
      '(service_role key: Supabase dashboard -> Project Settings -> API -> service_role)'
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

// Insert one draw across the 3 tables. Mirrors the sync route, including
// orphan cleanup if a child insert fails. Returns true on success.
async function insertGame(gi: GameInfo): Promise<boolean> {
  const { error: giError } = await supabase.from('game_info').insert({
    game_no: gi.game_no,
    game_date: gi.game_date,
    first_winner_amount: gi.first_winner_amount,
    first_winner_count: gi.first_winner_count,
    total_first_winner_amount: gi.total_first_winner_amount,
    second_winner_amount: gi.second_winner_amount,
    second_winner_count: gi.second_winner_count,
    total_second_winner_amount: gi.total_second_winner_amount,
    third_winner_amount: gi.third_winner_amount,
    third_winner_count: gi.third_winner_count,
    total_third_winner_amount: gi.total_third_winner_amount,
    fourth_winner_amount: gi.fourth_winner_amount,
    fourth_winner_count: gi.fourth_winner_count,
    total_fourth_winner_amount: gi.total_fourth_winner_amount,
    fifth_winner_amount: gi.fifth_winner_amount,
    fifth_winner_count: gi.fifth_winner_count,
    total_fifth_winner_amount: gi.total_fifth_winner_amount,
    total_winner_count: gi.total_winner_count,
    total_amount: gi.total_amount,
    total_sell_amount: gi.total_sell_amount,
    manual_winner_count: gi.manual_winner_count,
    auto_winner_count: gi.auto_winner_count,
  })
  if (giError) {
    console.warn(`  game ${gi.game_no}: game_info insert failed (${giError.message})`)
    return false
  }

  const balls = [
    gi.first_ball, gi.second_ball, gi.third_ball,
    gi.fourth_ball, gi.fifth_ball, gi.sixth_ball,
  ]
  const { error: wnError } = await supabase.from('win_numbers').insert(
    balls.map((number, i) => ({ game_no: gi.game_no, number, sequence: i + 1 }))
  )
  if (wnError) {
    await supabase.from('game_info').delete().eq('game_no', gi.game_no)
    console.warn(`  game ${gi.game_no}: win_numbers insert failed (${wnError.message}) - rolled back`)
    return false
  }

  const { error: bnError } = await supabase.from('bonus_number').insert({
    game_no: gi.game_no,
    number: gi.bonus_ball,
  })
  if (bnError) {
    await supabase.from('game_info').delete().eq('game_no', gi.game_no)
    console.warn(`  game ${gi.game_no}: bonus_number insert failed (${bnError.message}) - rolled back`)
    return false
  }

  return true
}

async function main() {
  console.log('Fetching latest game number from dhlottery.co.kr ...')
  const latestGameNo = await fetchLatestGameNo()
  if (latestGameNo === 0) {
    console.error('Could not determine the latest game number. Aborting.')
    process.exit(1)
  }

  const { data: maxRow } = await supabase
    .from('game_info')
    .select('game_no')
    .order('game_no', { ascending: false })
    .limit(1)
    .single()

  const lastSavedGameNo = (maxRow?.game_no as number | undefined) ?? 0
  const startAt = lastSavedGameNo + 1

  if (startAt > latestGameNo) {
    console.log(
      `Nothing to do. DB already has up to game ${lastSavedGameNo} (latest is ${latestGameNo}).`
    )
    return
  }

  console.log(
    `Seeding games ${startAt} .. ${latestGameNo} (${latestGameNo - startAt + 1} draws). ` +
      `Resuming from last saved game ${lastSavedGameNo}.`
  )

  let synced = 0
  let skipped = 0
  const seen = new Set<number>()

  // Walk forward in ~10-draw windows. Anchoring at cursor + WINDOW/2 makes the
  // centered window cover [cursor .. cursor+WINDOW-1], so each request yields a
  // fresh batch. seen/startAt/latest filters drop overlap and out-of-range rows.
  let cursor = startAt
  while (cursor <= latestGameNo) {
    const anchor = Math.min(cursor + Math.floor(WINDOW / 2), latestGameNo)
    let window: GameInfo[]
    try {
      window = await fetchGameInfoWindow(anchor)
    } catch (e) {
      console.warn(`  window @${anchor}: fetch failed (${(e as Error).message}) - retrying`)
      await new Promise((r) => setTimeout(r, 1000))
      try {
        window = await fetchGameInfoWindow(anchor)
      } catch {
        console.warn('  retry failed - aborting')
        break
      }
    }
    if (window.length === 0) break

    window.sort((a, b) => a.game_no - b.game_no)
    for (const gi of window) {
      if (gi.game_no < startAt || gi.game_no > latestGameNo || seen.has(gi.game_no)) continue
      seen.add(gi.game_no)
      if (await insertGame(gi)) synced++
      else skipped++
    }

    const maxInWindow = window[window.length - 1].game_no
    cursor = Math.max(cursor + 1, maxInWindow + 1)
    console.log(`  ... ${synced} synced (through game ${maxInWindow} / ${latestGameNo})`)
    await new Promise((r) => setTimeout(r, THROTTLE_MS))
  }

  // Verify final row counts
  const { count: giCount } = await supabase
    .from('game_info')
    .select('*', { count: 'exact', head: true })
  const { count: wnCount } = await supabase
    .from('win_numbers')
    .select('*', { count: 'exact', head: true })
  const { count: bnCount } = await supabase
    .from('bonus_number')
    .select('*', { count: 'exact', head: true })

  console.log('\nDone.')
  console.log(`  synced this run:  ${synced}`)
  console.log(`  skipped this run: ${skipped}`)
  console.log(`  game_info rows:   ${giCount}`)
  console.log(`  win_numbers rows: ${wnCount} (expect game_info x 6 = ${(giCount ?? 0) * 6})`)
  console.log(`  bonus_number rows:${bnCount} (expect = game_info)`)
}

main().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
