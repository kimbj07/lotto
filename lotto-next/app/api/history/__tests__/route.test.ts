/**
 * @jest-environment node
 */
// next/server (NextRequest/NextResponse) needs the web Request/Response
// globals, which exist in Node but not in jsdom — run this suite under node.
import { GET } from '../route'

// Mock the supabase layer so the route runs without a real DB.
const rpcMock = jest.fn()
const singleMock = jest.fn()
const fromMock = jest.fn(() => ({
  select: () => ({
    order: () => ({
      limit: () => ({ single: singleMock }),
    }),
  }),
}))

jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({ from: fromMock, rpc: rpcMock }),
}))

function makeReq(query: string) {
  // The route only reads req.nextUrl.searchParams; a URL satisfies that.
  return { nextUrl: new URL(`http://localhost/api/history?${query}`) } as never
}

function game(game_no: number) {
  return { game_no, game_date: '2026-06-27', first_ball: 1, second_ball: 2, third_ball: 3, fourth_ball: 4, fifth_ball: 5, sixth_ball: 6, bonus_ball: 7, first_winner_amount: 1000, first_winner_count: 1 }
}

beforeEach(() => {
  rpcMock.mockReset()
  singleMock.mockReset()
  fromMock.mockClear()
})

describe('GET /api/history — count validation', () => {
  it('rejects count < 1', async () => {
    const res = await GET(makeReq('count=0'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/count must be a positive integer/)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('rejects non-numeric count', async () => {
    const res = await GET(makeReq('count=abc'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/count must be a positive integer/)
    expect(rpcMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/history — default "latest N" load derives a bounded range', () => {
  it('DESC+count fetches the latest game_no and queries only that window', async () => {
    singleMock.mockResolvedValue({ data: { game_no: 1230 } })
    rpcMock.mockResolvedValue({ data: [game(1230), game(1229), game(1228), game(1227), game(1226)], error: null })

    const res = await GET(makeReq('order=DESC&count=5'))
    expect(res.status).toBe(200)

    // The window is the last 5 game numbers, not the whole table.
    expect(rpcMock).toHaveBeenCalledWith('get_game_info_in_range', {
      p_from: 1226,
      p_to: 1230,
      p_order: 'DESC',
    })
    expect((await res.json()).games).toHaveLength(5)
  })

  it('ASC+count queries the first N game numbers', async () => {
    singleMock.mockResolvedValue({ data: { game_no: 1230 } })
    rpcMock.mockResolvedValue({ data: [game(1), game(2), game(3)], error: null })

    await GET(makeReq('order=ASC&count=3'))
    expect(rpcMock).toHaveBeenCalledWith('get_game_info_in_range', {
      p_from: 1,
      p_to: 3,
      p_order: 'ASC',
    })
  })

  it('caps the derived window at game_no 1 near the start of the table', async () => {
    singleMock.mockResolvedValue({ data: { game_no: 3 } })
    rpcMock.mockResolvedValue({ data: [game(3), game(2), game(1)], error: null })

    await GET(makeReq('order=DESC&count=5'))
    expect(rpcMock).toHaveBeenCalledWith('get_game_info_in_range', {
      p_from: 1,
      p_to: 3,
      p_order: 'DESC',
    })
  })
})

describe('GET /api/history — count slicing safety net', () => {
  it('slices to the first N rows in the requested order', async () => {
    singleMock.mockResolvedValue({ data: { game_no: 1230 } })
    // RPC returns more than requested (e.g. game_no gaps widened the window).
    rpcMock.mockResolvedValue({ data: [game(1230), game(1229), game(1228), game(1227), game(1226), game(1225)], error: null })

    const res = await GET(makeReq('order=DESC&count=3'))
    const body = await res.json()
    expect(body.games.map((g: { game_no: number }) => g.game_no)).toEqual([1230, 1229, 1228])
  })
})

describe('GET /api/history — explicit range is untouched', () => {
  it('passes from/to straight through and does not fetch the latest game_no', async () => {
    rpcMock.mockResolvedValue({ data: [game(10), game(11), game(12)], error: null })

    const res = await GET(makeReq('from=10&to=12&order=ASC'))
    expect(res.status).toBe(200)
    expect(fromMock).not.toHaveBeenCalled() // no latest-game_no lookup
    expect(rpcMock).toHaveBeenCalledWith('get_game_info_in_range', {
      p_from: 10,
      p_to: 12,
      p_order: 'ASC',
    })
    expect((await res.json()).games).toHaveLength(3)
  })
})
