/**
 * @jest-environment node
 */
import { GET } from '../route'

const summaryOrderMock = jest.fn()
const modeSelectMock = jest.fn()
jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({
    from: (table: string) =>
      table === 'recommendation_mode_summary'
        ? { select: () => modeSelectMock() }
        : { select: () => ({ order: summaryOrderMock }) },
  }),
}))

function row(target_game_no: number, over: Partial<Record<string, number>> = {}) {
  return { target_game_no, total: 10, graded_count: 10, rank1: 0, rank2: 0, rank3: 0, rank4: 1, rank5: 3, ...over }
}
function modeRow(mode: string, over: Partial<Record<string, number>> = {}) {
  return { mode, total: 10, graded_count: 10, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 2, ...over }
}

beforeEach(() => {
  summaryOrderMock.mockReset()
  modeSelectMock.mockReset().mockResolvedValue({ data: [], error: null })
})

it('sums allTime and passes rounds through in order', async () => {
  summaryOrderMock.mockResolvedValue({ data: [row(100, { rank1: 1 }), row(99)], error: null })
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
  summaryOrderMock.mockResolvedValue({ data: [], error: null })
  const body = await (await GET()).json()
  expect(body.rounds).toEqual([])
  expect(body.allTime).toEqual({ total: 0, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 })
  expect(body.byMode).toEqual([])
})

it('returns the per-mode breakdown from recommendation_mode_summary', async () => {
  summaryOrderMock.mockResolvedValue({ data: [], error: null })
  modeSelectMock.mockResolvedValue({ data: [modeRow('stats', { rank5: 3 }), modeRow('random')], error: null })
  const body = await (await GET()).json()
  expect(body.byMode).toHaveLength(2)
  expect(body.byMode.map((m: { mode: string }) => m.mode)).toEqual(['stats', 'random'])
  expect(body.byMode[0].rank5).toBe(3)
})

it('degrades to an empty byMode when the mode-summary query errors', async () => {
  summaryOrderMock.mockResolvedValue({ data: [row(100)], error: null })
  modeSelectMock.mockResolvedValue({ data: null, error: { message: 'relation does not exist' } })
  const res = await GET()
  const body = await res.json()
  expect(res.status).toBe(200) // still serves the rest
  expect(body.rounds).toHaveLength(1)
  expect(body.byMode).toEqual([])
})
