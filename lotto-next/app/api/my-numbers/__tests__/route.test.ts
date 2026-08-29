/** @jest-environment node */
import { GET } from '../route'
import { NextRequest } from 'next/server'
import { GENERIC_ERROR } from '@/lib/apiError'

// win_numbers: a chainable stub whose final `.range(from, to)` slices a fixed
// row set, so we can prove paging past the PostgREST response cap works.
const winRows: { game_no: number; number: number }[] = []
const rangeMock = jest.fn((from: number, to: number) =>
  Promise.resolve({ data: winRows.slice(from, to + 1), error: null })
)
const bonusMock = jest.fn().mockResolvedValue({ data: [], error: null })

jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({
    from: (table: string) => {
      if (table === 'win_numbers') {
        return { select: () => ({ in: () => ({ order: () => ({ order: () => ({ range: rangeMock }) }) }) }) }
      }
      return { select: () => ({ in: () => ({ in: bonusMock }) }) }
    },
  }),
}))

function makeReq(nums: number[]) {
  const qs = nums.map((n, i) => `n${i + 1}=${n}`).join('&')
  return new NextRequest(`http://localhost/api/my-numbers?${qs}`)
}

beforeEach(() => {
  winRows.length = 0
  rangeMock.mockClear()
  bonusMock.mockClear().mockResolvedValue({ data: [], error: null })
})

describe('GET /api/my-numbers', () => {
  it('validates input', async () => {
    expect((await GET(makeReq([1, 2, 3, 4, 5]))).status).toBe(400)         // n6 missing
    expect((await GET(makeReq([1, 2, 3, 4, 5, 46]))).status).toBe(400)     // out of range
    expect((await GET(makeReq([1, 2, 3, 4, 5, 5]))).status).toBe(400)      // duplicate
  })

  it('pages through more rows than one response can hold and keeps every win', async () => {
    // 1300 draws each matching one ball (no prize) + draw 7 matching 3 balls
    // placed at the very END, i.e. past the first page.
    for (let g = 100; g < 1400; g++) winRows.push({ game_no: g, number: 1 })
    winRows.push({ game_no: 7, number: 1 }, { game_no: 7, number: 2 }, { game_no: 7, number: 3 })

    const res = await GET(makeReq([1, 2, 3, 4, 5, 6]))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(rangeMock.mock.calls.length).toBeGreaterThan(1) // actually paged
    expect(body.results).toEqual([
      { game_no: 7, win_number_count: 3, bonus_number_count: 0, rank: 5 },
    ])
  })

  it('adds the bonus ball and computes rank 2', async () => {
    winRows.push(...[1, 2, 3, 4, 5].map(number => ({ game_no: 42, number })))
    bonusMock.mockResolvedValue({ data: [{ game_no: 42, number: 6 }], error: null })
    const body = await (await GET(makeReq([1, 2, 3, 4, 5, 6]))).json()
    expect(body.results).toEqual([
      { game_no: 42, win_number_count: 5, bonus_number_count: 1, rank: 2 },
    ])
  })

  it('returns a generic message, not the raw DB error, on failure', async () => {
    rangeMock.mockResolvedValueOnce({ data: null, error: { message: 'relation "win_numbers" does not exist' } } as never)
    const res = await GET(makeReq([1, 2, 3, 4, 5, 6]))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe(GENERIC_ERROR)
    expect(JSON.stringify(body)).not.toContain('relation')
  })
})
