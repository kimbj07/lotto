import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { computeRank } from '@/lib/rank'
import type { MyRankInGame } from '@/types/lotto'

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

  // Count win number matches per game
  const { data: winMatches, error: winErr } = await supabase
    .from('win_numbers')
    .select('game_no, number')
    .in('number', numbers)

  if (winErr) return NextResponse.json({ error: winErr.message }, { status: 500 })

  // Aggregate match counts per game
  const matchMap = new Map<number, { winCount: number; bonusCount: number }>()
  for (const row of winMatches ?? []) {
    const entry = matchMap.get(row.game_no) ?? { winCount: 0, bonusCount: 0 }
    entry.winCount++
    matchMap.set(row.game_no, entry)
  }

  // Only games with 3+ win matches qualify
  const qualifyingGameNos = Array.from(matchMap.entries())
    .filter(([, v]) => v.winCount >= 3)
    .map(([k]) => k)

  if (qualifyingGameNos.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // Check bonus ball matches for qualifying games
  const { data: bonusMatches, error: bonusErr } = await supabase
    .from('bonus_number')
    .select('game_no, number')
    .in('game_no', qualifyingGameNos)
    .in('number', numbers)

  if (bonusErr) return NextResponse.json({ error: bonusErr.message }, { status: 500 })

  for (const row of bonusMatches ?? []) {
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
