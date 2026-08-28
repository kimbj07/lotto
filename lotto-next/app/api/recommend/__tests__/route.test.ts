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

describe('GET /api/recommend mode=target5', () => {
  it('returns 5 disjoint games and records them under one slip_id', async () => {
    const res = await GET(makeReq('mode=target5&include=7&exclude=1,2,3'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.games).toHaveLength(5)
    expect(new Set(body.games.flat()).size).toBe(30)
    expect(body.games[0]).toContain(7)
    expect(body.games.flat()).not.toContain(1)
    expect(typeof body.slipId).toBe('string')

    expect(insertMock).toHaveBeenCalledTimes(1)
    const rows = insertMock.mock.calls[0][0]
    expect(rows).toHaveLength(5)
    rows.forEach((row: { target_game_no: number; mode: string; slip_id: string; numbers: number[] }, i: number) => {
      expect(row.target_game_no).toBe(1231)
      expect(row.mode).toBe('target5')
      expect(row.slip_id).toBe(body.slipId)
      expect(row.numbers).toEqual(body.games[i])
    })
  })

  it('caps excludes at 15 for target5', async () => {
    const exclude = Array.from({ length: 16 }, (_, i) => i + 1).join(',')
    const res = await GET(makeReq(`mode=target5&exclude=${exclude}`))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/at most 15 exclude/)
  })

  // Both the PostgREST schema-cache error (what production actually emits,
  // PGRST204) and the raw Postgres one must trigger the retry.
  it.each([
    ["Could not find the 'slip_id' column of 'recommendations' in the schema cache"],
    ['column "slip_id" of relation "recommendations" does not exist'],
  ])('retries without slip_id when the column is missing: %s', async (message) => {
    insertMock
      .mockResolvedValueOnce({ error: { message } })
      .mockResolvedValueOnce({ error: null })
    const res = await GET(makeReq('mode=target5'))
    expect(res.status).toBe(200)
    expect(insertMock).toHaveBeenCalledTimes(2)
    const retryRows = insertMock.mock.calls[1][0]
    expect(retryRows).toHaveLength(5)
    retryRows.forEach((row: Record<string, unknown>) => expect(row).not.toHaveProperty('slip_id'))
  })
})
