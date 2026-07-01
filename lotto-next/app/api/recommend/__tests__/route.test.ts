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
    const row = insertMock.mock.calls[0][0]
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
