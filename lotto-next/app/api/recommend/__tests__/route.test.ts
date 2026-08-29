/** @jest-environment node */
import { GET } from '../route'
import { NextRequest } from 'next/server'
import type { GameInfo, AppearanceCount } from '@/types/lotto'

// Admin client mock (recordRecommendation): recommendations.insert + game_info lookup.
const insertMock = jest.fn().mockResolvedValue({ error: null })
const singleMock = jest.fn().mockResolvedValue({ data: { game_no: 1230 } })
const adminFrom = jest.fn((table: string) => {
  if (table === 'recommendations') return { insert: insertMock }
  return { select: () => ({ order: () => ({ limit: () => ({ single: singleMock }) }) }) }
})

jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(() => ({ from: jest.fn(), rpc: jest.fn() })),
  createAdminClient: () => ({ from: adminFrom }),
}))

function makeReq(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/recommend?${query}`)
}

beforeEach(() => {
  insertMock.mockClear().mockResolvedValue({ error: null })
  singleMock.mockClear().mockResolvedValue({ data: { game_no: 1230 } })
  const { createServerClient } = jest.requireMock('@/lib/supabase') as { createServerClient: jest.Mock }
  createServerClient.mockReset().mockReturnValue({ from: jest.fn(), rpc: jest.fn() })
})

describe('recording (best-effort)', () => {
  it('records a random recommendation tagged with the next round', async () => {
    const res = await GET(makeReq('mode=random'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.numbers).toHaveLength(6)
    expect(insertMock).toHaveBeenCalledTimes(1)
    // Rows are inserted as a batch (one element for single-game modes).
    const rows = insertMock.mock.calls[0][0]
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(row.target_game_no).toBe(1231) // latest 1230 + 1
    expect(row.mode).toBe('random')
    expect(row.numbers).toEqual(body.numbers)
  })

  it('still returns numbers when recording fails', async () => {
    insertMock.mockResolvedValue({ error: { message: 'boom' } })
    const res = await GET(makeReq('mode=random'))
    expect(res.status).toBe(200)
    expect((await res.json()).numbers).toHaveLength(6)
  })
})

describe('GET /api/recommend include/exclude', () => {
  it('applies include/exclude constraints on the random path', async () => {
    const res = await GET(makeReq('mode=random&include=7&exclude=1,2,3,4,5'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.numbers).toContain(7)
    expect(body.numbers.some((n: number) => [1, 2, 3, 4, 5].includes(n))).toBe(false)
    expect(body.numbers).toHaveLength(6)
  })

  it('rejects an invalid mode', async () => {
    const res = await GET(makeReq('mode=bogus'))
    expect(res.status).toBe(400)
  })

  it('rejects too many include numbers', async () => {
    const res = await GET(makeReq('mode=random&include=1,2,3,4,5,6'))
    expect(res.status).toBe(400)
  })

  it('rejects too many exclude numbers', async () => {
    const exclude = Array.from({ length: 39 }, (_, i) => i + 1).join(',')
    const res = await GET(makeReq(`mode=random&exclude=${exclude}`))
    expect(res.status).toBe(400)
  })

  it('rejects include/exclude overlap', async () => {
    const res = await GET(makeReq('mode=random&include=7&exclude=7'))
    expect(res.status).toBe(400)
  })

  it('rejects out-of-range numbers', async () => {
    const res = await GET(makeReq('mode=random&include=46'))
    expect(res.status).toBe(400)
  })

  it('stats path: honors include/exclude constraints via supabase', async () => {
    // Build minimal fixture data for the Supabase mocks
    const games: GameInfo[] = Array.from({ length: 10 }, (_, i) => ({
      game_no: 91 + i, game_date: '2024-01-01',
      first_ball: 1, second_ball: 2, third_ball: 3,
      fourth_ball: 4, fifth_ball: 5, sixth_ball: 6,
      bonus_ball: 8,
      first_winner_amount: 0, first_winner_count: 0, total_first_winner_amount: 0,
      second_winner_amount: 0, second_winner_count: 0, total_second_winner_amount: 0,
      third_winner_amount: 0, third_winner_count: 0, total_third_winner_amount: 0,
      fourth_winner_amount: 0, fourth_winner_count: 0, total_fourth_winner_amount: 0,
      fifth_winner_amount: 0, fifth_winner_count: 0, total_fifth_winner_amount: 0,
      total_winner_count: 0, total_amount: 0, total_sell_amount: 0,
      manual_winner_count: 0, auto_winner_count: 0,
    }))
    const counts: AppearanceCount[] = Array.from({ length: 45 }, (_, i) => ({
      number: i + 1, win_count: 45 - i, bonus_count: 1, sum_count: 46 - i,
    }))

    // Chain mock: from().select().order().limit().single()
    const mockSingle = jest.fn().mockResolvedValue({ data: { game_no: 100 }, error: null })
    const mockLimit = jest.fn().mockReturnValue({ single: mockSingle })
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit })
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder })
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect })
    // rpc: first call → games, second call → counts
    const mockRpc = jest.fn()
      .mockResolvedValueOnce({ data: games, error: null })
      .mockResolvedValueOnce({ data: counts, error: null })

    const { createServerClient: mockCreateServerClient } =
      jest.requireMock('@/lib/supabase') as { createServerClient: jest.Mock }
    mockCreateServerClient.mockReturnValue({ from: mockFrom, rpc: mockRpc })

    const res = await GET(makeReq('mode=stats&include=7&exclude=1,2,3'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.numbers).toHaveLength(6)
    expect(body.numbers).toContain(7)
    expect(body.numbers.some((n: number) => [1, 2, 3].includes(n))).toBe(false)
  })
})

describe('response contract', () => {
  it('single-game modes return games[] plus the deprecated numbers mirror', async () => {
    const body = await (await GET(makeReq('mode=random'))).json()
    expect(body.games).toHaveLength(1)
    expect(body.numbers).toEqual(body.games[0])
  })

  it('rejects non-integer numbers instead of truncating them', async () => {
    const res = await GET(makeReq('mode=random&exclude=7abc'))
    expect(res.status).toBe(400)
    const res2 = await GET(makeReq('mode=random&include=7.5'))
    expect(res2.status).toBe(400)
  })
})

describe('GET /api/recommend mode=target5', () => {
  it('returns 5 disjoint games and records them under one server-side slip_id', async () => {
    const res = await GET(makeReq('mode=target5&include=7&exclude=1,2,3'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.games).toHaveLength(5)
    expect(new Set(body.games.flat()).size).toBe(30)
    expect(body.games[0]).toContain(7)
    expect(body.games.flat()).not.toContain(1)
    // the slip id is an internal DB key; it is not exposed
    expect(body).not.toHaveProperty('slipId')
    expect(body).not.toHaveProperty('numbers')

    expect(insertMock).toHaveBeenCalledTimes(1)
    const rows = insertMock.mock.calls[0][0]
    expect(rows).toHaveLength(5)
    const slipId = rows[0].slip_id
    expect(slipId).toMatch(/^[0-9a-f-]{36}$/)
    rows.forEach((row: { target_game_no: number; mode: string; slip_id: string; numbers: number[] }, i: number) => {
      expect(row.target_game_no).toBe(1231)
      expect(row.mode).toBe('target5')
      expect(row.slip_id).toBe(slipId)
      expect(row.numbers).toEqual(body.games[i])
    })
  })

  it('accepts the exact boundary: 5 includes + 15 excludes → 30 numbers', async () => {
    const include = '16,17,18,19,20'
    const exclude = Array.from({ length: 15 }, (_, i) => i + 1).join(',')
    const res = await GET(makeReq(`mode=target5&include=${include}&exclude=${exclude}`))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.games.flat().sort((a: number, b: number) => a - b))
      .toEqual(Array.from({ length: 30 }, (_, i) => i + 16))
  })

  it('caps excludes at 15 for target5 and rejects include/exclude overlap', async () => {
    const exclude = Array.from({ length: 16 }, (_, i) => i + 1).join(',')
    const res = await GET(makeReq(`mode=target5&exclude=${exclude}`))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/at most 15 exclude/)
    const res2 = await GET(makeReq('mode=target5&include=7&exclude=7'))
    expect(res2.status).toBe(400)
  })

  // Both the PostgREST schema-cache error (what production actually emits,
  // PGRST204) and the raw Postgres one must trigger the retry. The route
  // remembers the missing column per module instance, so each case gets a
  // fresh module.
  describe.each([
    ["Could not find the 'slip_id' column of 'recommendations' in the schema cache"],
    ['column "slip_id" of relation "recommendations" does not exist'],
  ])('when the DB reports the slip_id column is missing (%s)', (message) => {
    let freshGet: typeof GET
    beforeEach(async () => {
      jest.resetModules()
      ;({ GET: freshGet } = await import('../route'))
    })

    it('retries without slip_id, then skips the doomed insert on later requests', async () => {
      insertMock
        .mockResolvedValueOnce({ error: { message } })
        .mockResolvedValueOnce({ error: null })
      const res = await freshGet(makeReq('mode=target5'))
      expect(res.status).toBe(200)
      expect(insertMock).toHaveBeenCalledTimes(2)
      const retryRows = insertMock.mock.calls[1][0]
      expect(retryRows).toHaveLength(5)
      retryRows.forEach((row: Record<string, unknown>) => expect(row).not.toHaveProperty('slip_id'))

      // second request on the same instance: straight to the no-slip insert
      insertMock.mockClear().mockResolvedValue({ error: null })
      await freshGet(makeReq('mode=target5'))
      expect(insertMock).toHaveBeenCalledTimes(1)
      insertMock.mock.calls[0][0].forEach((row: Record<string, unknown>) => expect(row).not.toHaveProperty('slip_id'))
    })
  })
})
