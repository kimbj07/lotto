/** @jest-environment node */
import { GET } from '../route'
import { clearCache } from '@/lib/cache'
import { GENERIC_ERROR } from '@/lib/apiError'

const singleMock = jest.fn()
const rpcMock = jest.fn()
jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({
    from: () => ({ select: () => ({ order: () => ({ limit: () => ({ single: singleMock }) }) }) }),
    rpc: rpcMock,
  }),
}))

function game(n: number) {
  return {
    game_no: n, first_ball: 1 + (n % 40), second_ball: 2 + (n % 40), third_ball: 3 + (n % 40),
    fourth_ball: 4 + (n % 40), fifth_ball: 5 + (n % 40), sixth_ball: 6 + (n % 40), bonus_ball: 45 - (n % 40),
  }
}

beforeEach(() => {
  clearCache()
  singleMock.mockReset().mockResolvedValue({ data: { game_no: 1238 }, error: null })
  rpcMock.mockReset().mockImplementation(async (_fn: string, args: { p_from: number; p_to: number }) => ({
    data: Array.from({ length: args.p_to - args.p_from + 1 }, (_, i) => game(args.p_from + i)),
    error: null,
  }))
})

describe('GET /api/stats/patterns', () => {
  it('reads the full history in chunks under the PostgREST row cap and returns a report', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    // 1238 draws → two chunks: 1..900 and 901..1238
    expect(rpcMock).toHaveBeenCalledTimes(2)
    expect(rpcMock.mock.calls[0][1]).toMatchObject({ p_from: 1, p_to: 900, p_order: 'ASC' })
    expect(rpcMock.mock.calls[1][1]).toMatchObject({ p_from: 901, p_to: 1238, p_order: 'ASC' })
    const body = await res.json()
    expect(body.draws).toBe(1238)
    expect(body.toGameNo).toBe(1238)
    expect(body.tests).toHaveLength(5)
    expect(res.headers.get('Cache-Control')).toContain('s-maxage')
  })

  it('keeps paging from the last row returned when the DB caps a chunk (no silent hole)', async () => {
    // Simulate Max rows lowered to 500: every chunk returns at most 500 rows.
    rpcMock.mockImplementation(async (_fn: string, args: { p_from: number; p_to: number }) => ({
      data: Array.from({ length: Math.min(500, args.p_to - args.p_from + 1) }, (_, i) => game(args.p_from + i)),
      error: null,
    }))
    const body = await (await GET()).json()
    expect(body.draws).toBe(1238)
    expect(rpcMock.mock.calls.map(c => c[1].p_from)).toEqual([1, 501, 1001])
  })

  it('handles a latest game_no that is an exact multiple of the chunk size', async () => {
    singleMock.mockResolvedValue({ data: { game_no: 1800 }, error: null })
    const body = await (await GET()).json()
    expect(body.draws).toBe(1800)
    expect(rpcMock.mock.calls.map(c => [c[1].p_from, c[1].p_to])).toEqual([[1, 900], [901, 1800]])
  })

  it('advances past an empty range (gap in game_no) instead of looping', async () => {
    rpcMock.mockImplementation(async (_fn: string, args: { p_from: number; p_to: number }) => ({
      data: args.p_from === 1 ? [] : Array.from({ length: args.p_to - args.p_from + 1 }, (_, i) => game(args.p_from + i)),
      error: null,
    }))
    const body = await (await GET()).json()
    expect(body.draws).toBe(1238 - 900)
    expect(rpcMock).toHaveBeenCalledTimes(2)
  })

  it('serves the second call from the in-memory cache', async () => {
    await GET()
    await GET()
    expect(rpcMock).toHaveBeenCalledTimes(2) // not 4
  })

  it('does not cache an empty history', async () => {
    singleMock.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } })
    expect((await (await GET()).json()).draws).toBe(0)
    singleMock.mockResolvedValue({ data: { game_no: 50 }, error: null })
    expect((await (await GET()).json()).draws).toBe(50)
  })

  it('hides raw DB errors', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'function get_game_info_in_range does not exist' } })
    const res = await GET()
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe(GENERIC_ERROR)
  })
})
