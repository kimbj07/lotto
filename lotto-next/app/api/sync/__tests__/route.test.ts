/**
 * @jest-environment node
 */
// Verifies the cron sync evicts the history cache — but only when new draws
// were actually inserted.
import { GET } from '../route'
import { clearCache } from '@/lib/cache'
import { fetchLatestGameNo, fetchGameInfo } from '@/lib/lotto-api'

jest.mock('@/lib/cache')

const insertMock = jest.fn()
const rpcMock = jest.fn()
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

const realSetTimeout = global.setTimeout

beforeEach(() => {
  process.env.CRON_SECRET = 'test-secret'
  ;(clearCache as jest.Mock).mockClear()
  insertMock.mockReset().mockResolvedValue({ error: null })
  rpcMock.mockReset().mockResolvedValue({ error: null })
  singleMock.mockReset()
  fetchLatest.mockReset()
  fetchGame.mockReset()
  // The sync loop pauses 300ms between draws; run it synchronously in tests.
  // Plain assignment, not jest.spyOn: after importing next/server, setTimeout
  // is no longer an own property of `global`, so spyOn's restore *deletes* it
  // and every test after the first failed with "Property setTimeout does not
  // exist" (these 3 tests had never actually run since PR #7).
  global.setTimeout = ((fn: () => void) => { fn(); return 0 }) as never
})

afterEach(() => {
  global.setTimeout = realSetTimeout
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
  expect(rpcMock).toHaveBeenCalledWith('grade_pending_recommendations')
  expect(rpcMock.mock.calls.filter(c => c[0] === 'grade_pending_recommendations')).toHaveLength(1)
})

it('does not grade or refresh when nothing is synced', async () => {
  singleMock.mockResolvedValue({ data: { game_no: 1231 } })
  fetchLatest.mockResolvedValue(1231)

  await GET(authedReq())

  expect(rpcMock).not.toHaveBeenCalled()
})

describe('failure handling', () => {
  it('returns 502 (not an unhandled 500) when dhlottery is unreachable', async () => {
    fetchLatest.mockRejectedValue(new Error('Request failed (503)'))
    const res = await GET(authedReq())
    expect(res.status).toBe(502)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('treats a DB error on max(game_no) as fatal instead of re-syncing from draw 1', async () => {
    singleMock.mockResolvedValue({ data: null, error: { code: '08006', message: 'connection failure' } })
    fetchLatest.mockResolvedValue(1231)
    const res = await GET(authedReq())
    expect(res.status).toBe(500)
    expect(fetchGame).not.toHaveBeenCalled()
  })

  it('starts from draw 1 when the table is genuinely empty (PGRST116)', async () => {
    singleMock.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } })
    fetchLatest.mockResolvedValue(2)
    fetchGame.mockImplementation(async (n: number) => fullGame(n))
    const body = await (await GET(authedReq())).json()
    expect(body.lastSavedGameNo).toBe(0)
    expect(body.synced).toBe(2)
    expect(fetchGame).toHaveBeenCalledWith(1)
  })

  it('stops at the first failed draw so it is retried next run (no permanent hole)', async () => {
    singleMock.mockResolvedValue({ data: { game_no: 1230 } })
    fetchLatest.mockResolvedValue(1233)
    fetchGame.mockImplementation(async (n: number) => {
      if (n === 1232) throw new Error('No data for game 1232')
      return fullGame(n)
    })
    const body = await (await GET(authedReq())).json()
    expect(body.synced).toBe(1)          // 1231 only
    expect(body.skipped).toBe(1)
    expect(fetchGame).not.toHaveBeenCalledWith(1233) // did NOT jump past 1232
    expect(body.remaining).toBe(2)
    expect(body.errors[0]).toMatch(/fetch 1232/)
    // partial progress still grades + refreshes + evicts
    expect(rpcMock).toHaveBeenCalledWith('refresh_recommendation_summary')
    expect(clearCache).toHaveBeenCalledTimes(1)
  })

  it('caps a catch-up at MAX_GAMES_PER_RUN and reports the remainder', async () => {
    singleMock.mockResolvedValue({ data: { game_no: 1000 } })
    fetchLatest.mockResolvedValue(1100)
    fetchGame.mockImplementation(async (n: number) => fullGame(n))
    const body = await (await GET(authedReq())).json()
    expect(body.synced).toBe(10)
    expect(body.remaining).toBe(90)
  })

  it('reports RPC errors instead of claiming a clean run', async () => {
    singleMock.mockResolvedValue({ data: { game_no: 1230 } })
    fetchLatest.mockResolvedValue(1231)
    fetchGame.mockResolvedValue(fullGame(1231))
    rpcMock.mockImplementation(async (fn: string) =>
      fn === 'refresh_recommendation_summary' ? { error: { message: 'DELETE requires a WHERE clause' } } : { error: null }
    )
    const body = await (await GET(authedReq())).json()
    expect(body.synced).toBe(1)
    expect(body.errors).toEqual([expect.stringMatching(/refresh_recommendation_summary: DELETE requires/)])
  })
})
