import type { GameInfo } from '@/types/lotto'

const USER_AGENT =
  'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)'

const BASE_URL = 'https://www.dhlottery.co.kr'

// dhlottery.co.kr was rebuilt in 2026; the legacy `common.do?method=getLottoNumber`
// JSON API was removed (it now 302s to the homepage). The current site serves
// draw data from two JSON endpoints:
//   /selectMainInfo.do                  -> recent draws (used to find the latest)
//   /lt645/selectPstLt645InfoNew.do     -> a 10-draw window centered on a draw
// Field names changed too (ltEpsd, tm1WnNo.., bnsWnNo, rnkNWnAmt..) — see
// parseLt645Entry below.

// Shape of a single lt645 draw entry (only the fields we consume are typed).
interface Lt645Entry {
  ltEpsd: number
  ltRflYmd: string | number
  tm1WnNo: number; tm2WnNo: number; tm3WnNo: number
  tm4WnNo: number; tm5WnNo: number; tm6WnNo: number
  bnsWnNo: number
  rnk1WnAmt?: number; rnk1WnNope?: number; rnk1SumWnAmt?: number
  rnk2WnAmt?: number; rnk2WnNope?: number; rnk2SumWnAmt?: number
  rnk3WnAmt?: number; rnk3WnNope?: number; rnk3SumWnAmt?: number
  rnk4WnAmt?: number; rnk4WnNope?: number; rnk4SumWnAmt?: number
  rnk5WnAmt?: number; rnk5WnNope?: number; rnk5SumWnAmt?: number
  sumWnNope?: number
  rlvtEpsdSumNtslAmt?: number
}

// "20240127" -> "2024-01-27" (already-dashed dates pass through unchanged).
export function formatDrawDate(ymd: string | number): string {
  const s = String(ymd)
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  return s
}

// Map a raw lt645 entry to our snake_case GameInfo. manual/auto winner counts
// are not exposed by the new API, so they stay 0 (as the legacy parser also did).
export function parseLt645Entry(e: Lt645Entry): GameInfo {
  const n = (v: number | undefined) => v ?? 0
  return {
    game_no: e.ltEpsd,
    game_date: formatDrawDate(e.ltRflYmd),
    first_ball: e.tm1WnNo,
    second_ball: e.tm2WnNo,
    third_ball: e.tm3WnNo,
    fourth_ball: e.tm4WnNo,
    fifth_ball: e.tm5WnNo,
    sixth_ball: e.tm6WnNo,
    bonus_ball: e.bnsWnNo,
    first_winner_amount: n(e.rnk1WnAmt),
    first_winner_count: n(e.rnk1WnNope),
    total_first_winner_amount: n(e.rnk1SumWnAmt),
    second_winner_amount: n(e.rnk2WnAmt),
    second_winner_count: n(e.rnk2WnNope),
    total_second_winner_amount: n(e.rnk2SumWnAmt),
    third_winner_amount: n(e.rnk3WnAmt),
    third_winner_count: n(e.rnk3WnNope),
    total_third_winner_amount: n(e.rnk3SumWnAmt),
    fourth_winner_amount: n(e.rnk4WnAmt),
    fourth_winner_count: n(e.rnk4WnNope),
    total_fourth_winner_amount: n(e.rnk4SumWnAmt),
    fifth_winner_amount: n(e.rnk5WnAmt),
    fifth_winner_count: n(e.rnk5WnNope),
    total_fifth_winner_amount: n(e.rnk5SumWnAmt),
    total_winner_count: n(e.sumWnNope),
    total_amount:
      n(e.rnk1SumWnAmt) + n(e.rnk2SumWnAmt) + n(e.rnk3SumWnAmt) +
      n(e.rnk4SumWnAmt) + n(e.rnk5SumWnAmt),
    total_sell_amount: n(e.rlvtEpsdSumNtslAmt),
    manual_winner_count: 0,
    auto_winner_count: 0,
  }
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'User-Agent': USER_AGENT, Referer: `${BASE_URL}/` },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${path}`)
  }
  return res.json()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asEntries(json: any, ...path: string[]): Lt645Entry[] {
  let node = json
  for (const key of path) node = node?.[key]
  return Array.isArray(node) ? (node as Lt645Entry[]) : []
}

// Latest published draw number, from the recent-draws block on the homepage feed.
export async function fetchLatestGameNo(): Promise<number> {
  const json = await fetchJson('/selectMainInfo.do')
  const recent = asEntries(json, 'data', 'result', 'pstLtEpstInfo', 'lt645')
  return recent.reduce((max, e) => Math.max(max, Number(e.ltEpsd) || 0), 0)
}

// All draws in the 10-wide window centered on `anchor` (clamped at the ends).
export async function fetchGameInfoWindow(anchor: number): Promise<GameInfo[]> {
  const json = await fetchJson(
    `/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=${anchor}`
  )
  return asEntries(json, 'data', 'list').map(parseLt645Entry)
}

// A single draw. Throws if the draw has no data (out of range / not yet drawn).
export async function fetchGameInfo(gameNo: number): Promise<GameInfo> {
  const window = await fetchGameInfoWindow(gameNo)
  const found = window.find((g) => g.game_no === gameNo)
  if (!found) {
    throw new Error(`No data for game ${gameNo}`)
  }
  return found
}
