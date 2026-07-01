/**
 * @jest-environment node
 */
import { GET } from '../route'

const orderMock = jest.fn()
jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({
    from: () => ({ select: () => ({ order: orderMock }) }),
  }),
}))

function row(target_game_no: number, over: Partial<Record<string, number>> = {}) {
  return { target_game_no, total: 10, graded_count: 10, rank1: 0, rank2: 0, rank3: 0, rank4: 1, rank5: 3, ...over }
}

beforeEach(() => orderMock.mockReset())

it('sums allTime and passes rounds through in order', async () => {
  orderMock.mockResolvedValue({ data: [row(100, { rank1: 1 }), row(99)], error: null })
  const res = await GET()
  const body = await res.json()
  expect(res.status).toBe(200)
  expect(body.rounds).toHaveLength(2)
  expect(body.rounds[0].target_game_no).toBe(100)
  expect(body.allTime.total).toBe(20)
  expect(body.allTime.rank1).toBe(1)
  expect(body.allTime.rank5).toBe(6)
})

it('returns zeros and empty rounds when there is no data', async () => {
  orderMock.mockResolvedValue({ data: [], error: null })
  const body = await (await GET()).json()
  expect(body.rounds).toEqual([])
  expect(body.allTime).toEqual({ total: 0, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 })
})
