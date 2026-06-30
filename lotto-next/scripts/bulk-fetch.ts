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
import { fetchLatestGameNo, fetchGameInfo } from '../lib/lotto-api'

const THROTTLE_MS = 200 // pause between official-site fetches

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

  for (let gameNo = startAt; gameNo <= latestGameNo; gameNo++) {
    let gameInfo
    try {
      gameInfo = await fetchGameInfo(gameNo)
    } catch (e) {
      console.warn(`  game ${gameNo}: fetch failed (${(e as Error).message}) - skipping`)
      skipped++
      continue
    }

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
      console.warn(`  game ${gameNo}: game_info insert failed (${giError.message}) - skipping`)
      skipped++
      continue
    }

    const balls = [
      gameInfo.first_ball, gameInfo.second_ball, gameInfo.third_ball,
      gameInfo.fourth_ball, gameInfo.fifth_ball, gameInfo.sixth_ball,
    ]
    const { error: wnError } = await supabase.from('win_numbers').insert(
      balls.map((number, i) => ({ game_no: gameInfo.game_no, number, sequence: i + 1 }))
    )
    if (wnError) {
      await supabase.from('game_info').delete().eq('game_no', gameInfo.game_no)
      console.warn(`  game ${gameNo}: win_numbers insert failed (${wnError.message}) - rolled back`)
      skipped++
      continue
    }

    const { error: bnError } = await supabase.from('bonus_number').insert({
      game_no: gameInfo.game_no,
      number: gameInfo.bonus_ball,
    })
    if (bnError) {
      await supabase.from('game_info').delete().eq('game_no', gameInfo.game_no)
      console.warn(`  game ${gameNo}: bonus_number insert failed (${bnError.message}) - rolled back`)
      skipped++
      continue
    }

    synced++
    if (synced % 50 === 0) {
      console.log(`  ... ${synced} synced (at game ${gameNo} / ${latestGameNo})`)
    }

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
