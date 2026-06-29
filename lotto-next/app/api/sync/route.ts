import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { fetchLatestGameNo, fetchGameInfo } from '@/lib/lotto-api'

// Called by Vercel Cron (see vercel.json) and manually via POST /api/sync.
// Protected by CRON_SECRET when called from outside Vercel infra.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  // Vercel sets x-vercel-signature for cron; allow bare secret too for manual calls
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  // 1. Get latest game number from official site
  const latestGameNo = await fetchLatestGameNo()
  if (latestGameNo === 0) {
    return NextResponse.json({ error: 'Could not fetch latest game number' }, { status: 502 })
  }

  // 2. Get last saved game number from DB
  const { data: maxRow } = await supabase
    .from('game_info')
    .select('game_no')
    .order('game_no', { ascending: false })
    .limit(1)
    .single()

  const lastSavedGameNo = maxRow?.game_no ?? 0

  let synced = 0
  let skipped = 0

  // 3. Insert each missing game
  for (let gameNo = lastSavedGameNo + 1; gameNo <= latestGameNo; gameNo++) {
    let gameInfo
    try {
      gameInfo = await fetchGameInfo(gameNo)
    } catch {
      skipped++
      continue
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
    if (giError) { skipped++; continue }

    // Insert 6 win_numbers rows
    const balls = [
      gameInfo.first_ball, gameInfo.second_ball, gameInfo.third_ball,
      gameInfo.fourth_ball, gameInfo.fifth_ball, gameInfo.sixth_ball,
    ]
    const { error: wnError } = await supabase.from('win_numbers').insert(
      balls.map((number, i) => ({ game_no: gameInfo.game_no, number, sequence: i + 1 }))
    )
    if (wnError) { skipped++; continue }

    // Insert bonus_number row
    const { error: bnError } = await supabase.from('bonus_number').insert({
      game_no: gameInfo.game_no,
      number: gameInfo.bonus_ball,
    })
    if (bnError) { skipped++; continue }

    synced++

    // Brief pause to avoid hammering the official API
    await new Promise(r => setTimeout(r, 300))
  }

  return NextResponse.json({ synced, skipped, latestGameNo, lastSavedGameNo })
}
