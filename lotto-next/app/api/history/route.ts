import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getCached, setCached } from '@/lib/cache'
import type { GameInfo } from '@/types/lotto'

// Only bounded counts are cached, so a user-controlled `?count=999999` can never
// grow the cache Map unboundedly; larger counts fall through to a normal fetch.
const CACHEABLE_MAX_COUNT = 50

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from') ? parseInt(searchParams.get('from')!, 10) : null
  const to = searchParams.get('to') ? parseInt(searchParams.get('to')!, 10) : null
  const order = searchParams.get('order') === 'ASC' ? 'ASC' : 'DESC'
  const count = searchParams.get('count') ? parseInt(searchParams.get('count')!, 10) : null

  if (from !== null && (isNaN(from) || from < 1)) {
    return NextResponse.json({ error: 'from must be a positive integer' }, { status: 400 })
  }
  if (to !== null && (isNaN(to) || to < 1)) {
    return NextResponse.json({ error: 'to must be a positive integer' }, { status: 400 })
  }
  if (from !== null && to !== null && from > to) {
    return NextResponse.json({ error: 'from must be <= to' }, { status: 400 })
  }
  if (count !== null && (isNaN(count) || count < 1)) {
    return NextResponse.json({ error: 'count must be a positive integer' }, { status: 400 })
  }

  const supabase = createServerClient()

  // The default "latest N" load (a bounded count with no explicit range) returns
  // data that does not change until the next weekly draw, so cache it locally.
  // A hit skips both the latest-game_no lookup and the expensive RPC below.
  const cacheKey =
    count !== null && from === null && to === null && count <= CACHEABLE_MAX_COUNT
      ? `history:latest:${order}:${count}`
      : null
  if (cacheKey) {
    const cached = getCached<GameInfo[]>(cacheKey)
    if (cached) return NextResponse.json({ games: cached })
  }

  // When a bounded `count` is requested without an explicit range (the default
  // "latest N" history load), derive a narrow game_no window so the RPC
  // aggregates only the rows we need. Without this, get_game_info_in_range runs
  // its full multi-join GROUP BY over the entire (ever-growing) draw table and
  // serializes every row back just to slice off N — on every page open.
  let effectiveFrom = from
  let effectiveTo = to
  if (count !== null && from === null && to === null) {
    const { data: latestRow } = await supabase
      .from('game_info')
      .select('game_no')
      .order('game_no', { ascending: false })
      .limit(1)
      .single()
    const latestNo = (latestRow?.game_no as number | undefined) ?? 0
    if (latestNo > 0) {
      if (order === 'DESC') {
        effectiveFrom = Math.max(1, latestNo - count + 1)
        effectiveTo = latestNo
      } else {
        effectiveFrom = 1
        effectiveTo = count
      }
    }
  }

  const { data, error } = await supabase.rpc('get_game_info_in_range', {
    p_from: effectiveFrom,
    p_to: effectiveTo,
    p_order: order,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let games = (data as GameInfo[]) ?? []
  // `count` caps the result to the first N rows (in the requested order) —
  // e.g. order=DESC&count=5 yields the 5 most recent draws. Kept as a safety
  // net in case the derived window covers more rows than requested (game_no gaps).
  if (count !== null) games = games.slice(0, count)

  // Cache only non-empty default-latest results. Errors already returned above;
  // an empty (table-cold) [] is never cached so freshly-seeded data isn't hidden.
  if (cacheKey && games.length > 0) setCached(cacheKey, games)

  return NextResponse.json({ games })
}
