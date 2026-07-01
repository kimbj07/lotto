/** @jest-environment node */
import { GET } from '../route'
import { NextRequest } from 'next/server'
import type { GameInfo, AppearanceCount } from '@/types/lotto'

jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(),
}))

function makeReq(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/recommend?${query}`)
}

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
