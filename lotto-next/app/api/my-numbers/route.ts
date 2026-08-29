import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { computeRank } from '@/lib/rank'
import { serverError } from '@/lib/apiError'
import type { MyRankInGame } from '@/types/lotto'

// PostgREST caps every response at the project's "Max rows" setting (1000 by
// default). This lookup returns one row per matching ball across ALL draws —
// ≈ 6 × 6/45 ≈ 0.8 rows per draw, i.e. ~984 rows at draw 1230 — so an
// un-paged query already sits at the cap and truncates SILENTLY (older wins
// simply vanish). Page through in fixed-size ranges instead.
const PAGE = 500

interface MatchRow { game_no: number; number: number }

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const numbers = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6']
    .map(k => parseInt(searchParams.get(k) ?? '', 10))

  if (numbers.some(isNaN)) {
    return NextResponse.json({ error: 'Provide n1 through n6 as integers' }, { status: 400 })
  }
  if (numbers.some(n => n < 1 || n > 45)) {
    return NextResponse.json({ error: 'All numbers must be between 1 and 45' }, { status: 400 })
  }
  if (new Set(numbers).size !== 6) {
    return NextResponse.json({ error: 'All 6 numbers must be unique' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Count win number matches per game, paging past the response-size cap.
  const matchMap = new Map<number, { winCount: number; bonusCount: number }>()
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('win_numbers')
      .select('game_no, number')
      .in('number', numbers)
      .order('game_no', { ascending: true })
      .order('number', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) return serverError('my-numbers.win', error.message)
    const rows = (data ?? []) as MatchRow[]
    for (const row of rows) {
      const entry = matchMap.get(row.game_no) ?? { winCount: 0, bonusCount: 0 }
      entry.winCount++
      matchMap.set(row.game_no, entry)
    }
    if (rows.length < PAGE) break
  }

  // Only games with 3+ win matches qualify
  const qualifyingGameNos = Array.from(matchMap.entries())
    .filter(([, v]) => v.winCount >= 3)
    .map(([k]) => k)

  if (qualifyingGameNos.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // Check bonus ball matches for qualifying games (bounded: ≤ one row per
  // qualifying game, and qualifying games are rare).
  const { data: bonusMatches, error: bonusErr } = await supabase
    .from('bonus_number')
    .select('game_no, number')
    .in('game_no', qualifyingGameNos)
    .in('number', numbers)

  if (bonusErr) return serverError('my-numbers.bonus', bonusErr.message)

  for (const row of (bonusMatches ?? []) as MatchRow[]) {
    const entry = matchMap.get(row.game_no)
    if (entry) entry.bonusCount++
  }

  const results: MyRankInGame[] = qualifyingGameNos
    .map(gameNo => {
      const { winCount, bonusCount } = matchMap.get(gameNo)!
      return {
        game_no: gameNo,
        win_number_count: winCount,
        bonus_number_count: bonusCount,
        rank: computeRank(winCount, bonusCount),
      }
    })
    .sort((a, b) => a.game_no - b.game_no)

  return NextResponse.json({ results })
}
