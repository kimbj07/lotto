import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { AppearanceCount, AppearanceSortBy, SortOrder } from '@/types/lotto'

const VALID_SORT_BY: AppearanceSortBy[] = ['winCount', 'bonusCount', 'sumCount', 'number']

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from') ? parseInt(searchParams.get('from')!, 10) : null
  const to = searchParams.get('to') ? parseInt(searchParams.get('to')!, 10) : null
  const sortBy = (searchParams.get('sortBy') ?? 'winCount') as AppearanceSortBy
  const orderParam = searchParams.get('order') ?? 'DESC'
  if (orderParam !== 'ASC' && orderParam !== 'DESC') {
    return NextResponse.json({ error: 'order must be ASC or DESC' }, { status: 400 })
  }
  const order = orderParam as SortOrder
  const count = searchParams.get('count') ? parseInt(searchParams.get('count')!, 10) : null

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ stats: data as AppearanceCount[] })
}
