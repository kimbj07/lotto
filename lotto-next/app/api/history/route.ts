import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { GameInfo } from '@/types/lotto'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from') ? parseInt(searchParams.get('from')!, 10) : null
  const to = searchParams.get('to') ? parseInt(searchParams.get('to')!, 10) : null
  const order = searchParams.get('order') === 'ASC' ? 'ASC' : 'DESC'

  if (from !== null && (isNaN(from) || from < 1)) {
    return NextResponse.json({ error: 'from must be a positive integer' }, { status: 400 })
  }
  if (to !== null && (isNaN(to) || to < 1)) {
    return NextResponse.json({ error: 'to must be a positive integer' }, { status: 400 })
  }
  if (from !== null && to !== null && from > to) {
    return NextResponse.json({ error: 'from must be <= to' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('get_game_info_in_range', {
    p_from: from,
    p_to: to,
    p_order: order,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ games: data as GameInfo[] })
}
