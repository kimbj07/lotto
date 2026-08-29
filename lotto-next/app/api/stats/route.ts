import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { serverError } from '@/lib/apiError'
import { WEEKLY_CACHE_CONTROL } from '@/lib/httpCache'
import type { AppearanceCount, AppearanceSortBy, SortOrder } from '@/types/lotto'

const VALID_SORT_BY: AppearanceSortBy[] = ['winCount', 'bonusCount', 'sumCount', 'number']

// Same rules as /api/history — previously unvalidated, so `?count=-1` reached
// `LIMIT -1` in SQL (500 with a raw Postgres message) and `?from=abc` silently
// meant "no filter".
function positiveIntOrNull(raw: string | null): number | null | 'bad' {
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 ? n : 'bad'
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = positiveIntOrNull(searchParams.get('from'))
  const to = positiveIntOrNull(searchParams.get('to'))
  const count = positiveIntOrNull(searchParams.get('count'))
  if (from === 'bad') return NextResponse.json({ error: 'from must be a positive integer' }, { status: 400 })
  if (to === 'bad') return NextResponse.json({ error: 'to must be a positive integer' }, { status: 400 })
  if (count === 'bad') return NextResponse.json({ error: 'count must be a positive integer' }, { status: 400 })
  if (from !== null && to !== null && from > to) {
    return NextResponse.json({ error: 'from must be <= to' }, { status: 400 })
  }

  const sortBy = (searchParams.get('sortBy') ?? 'winCount') as AppearanceSortBy
  const orderParam = searchParams.get('order') ?? 'DESC'
  if (orderParam !== 'ASC' && orderParam !== 'DESC') {
    return NextResponse.json({ error: 'order must be ASC or DESC' }, { status: 400 })
  }
  const order = orderParam as SortOrder

  if (!VALID_SORT_BY.includes(sortBy)) {
    return NextResponse.json(
      { error: `sortBy must be one of: ${VALID_SORT_BY.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('get_appearance_count', {
    p_from: from,
    p_to: to,
    p_sort_by: sortBy,
    p_sort_order: order,
    p_count: count,
  })

  if (error) return serverError('stats', error.message)

  return NextResponse.json(
    { stats: data as AppearanceCount[] },
    { headers: { 'Cache-Control': WEEKLY_CACHE_CONTROL } }
  )
}
