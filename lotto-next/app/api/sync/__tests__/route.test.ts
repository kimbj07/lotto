/**
 * @jest-environment node
 */
// Verifies the cron sync evicts the history cache — but only when new draws
// were actually inserted.
import { GET } from '../route'
import { clearCache } from '@/lib/cache'
import { fetchLatestGameNo, fetchGameInfo } from '@/lib/lotto-api'

jest.mock('@/lib/cache')

const insertMock = jest.fn().mockResolvedValue({ error: null })
const rpcMock = jest.fn().mockResolvedValue({ error: null })
const singleMock = jest.fn()
jest.mock('@/lib/supabase', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ order: () => ({ limit: () => ({ single: singleMock }) }) }),
      insert: insertMock,
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
    rpc: rpcMock,
  }),
}))

jest.mock('@/lib/lotto-api', () => ({
  fetchLatestGameNo: jest.fn(),
  fetchGameInfo: jest.fn(),
}))

const fetchLatest = fetchLatestGameNo as jest.Mock
const fetchGame = fetchGameInfo as jest.Mock

function authedReq() {
  return {
    headers: { get: (k: string) => (k === 'authorization' ? `Bearer ${process.env.CRON_SECRET}` : null) },
  } as never
}

function fullGame(n: number) {
  return {
    game_no: n, game_date: '2026-07-05',
    first_ball: 1, second_ball: 2, third_ball: 3, fourth_ball: 4, fifth_ball: 5, sixth_ball: 6,
    bonus_ball: 7,
  }
}

beforeEach(() => {
  process.env.CRON_SECRET = 'test-secret'
  ;(clearCache as jest.Mock).mockClear()
  insertMock.mockClear()
  rpcMock.mockClear()
  singleMock.mockReset()
  fetchLatest.mockReset()
  fetchGame.mockReset()
  // The sync loop pauses 300ms between draws; run it synchronously in tests.
  jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void) => { fn(); return 0 }) as never)
})

afterEach(() => {
  jest.restoreAllMocks()
})

it('evicts the cache when new draws are synced', async () => {
  singleMock.mockResolvedValue({ data: { game_no: 1230 } }) // last saved
  fetchLatest.mockResolvedValue(1231) // one new draw available
  fetchGame.mockResolvedValue(fullGame(1231))

  const res = await GET(authedReq())
  expect((await res.json()).synced).toBe(1)
  expect(clearCache).toHaveBeenCalledTimes(1)
})

it('does not evict when there is nothing new to sync', async () => {
  singleMock.mockResolvedValue({ data: { game_no: 1231 } })
  fetchLatest.mockResolvedValue(1231) // already up to date

  const res = await GET(authedReq())
  expect((await res.json()).synced).toBe(0)
  expect(clearCache).not.toHaveBeenCalled()
})

it('grades each synced round and rebuilds the summary once', async () => {
  singleMock.mockResolvedValue({ data: { game_no: 1230 } })
  fetchLatest.mockResolvedValue(1231)
  fetchGame.mockResolvedValue(fullGame(1231))

  await GET(authedReq())

  expect(rpcMock).toHaveBeenCalledWith('grade_recommendations', { p_game_no: 1231 })
  expect(rpcMock).toHaveBeenCalledWith('refresh_recommendation_summary')
  expect(rpcMock.mock.calls.filter(c => c[0] === 'refresh_recommendation_summary')).toHaveLength(1)
})

it('does not grade or refresh when nothing is synced', async () => {
  singleMock.mockResolvedValue({ data: { game_no: 1231 } })
  fetchLatest.mockResolvedValue(1231)

  await GET(authedReq())

  expect(rpcMock).not.toHaveBeenCalled()
})
