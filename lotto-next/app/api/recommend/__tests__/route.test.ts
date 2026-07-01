/**
 * @jest-environment node
 */
import { GET } from '../route'

const insertMock = jest.fn().mockResolvedValue({ error: null })
const singleMock = jest.fn().mockResolvedValue({ data: { game_no: 1230 } })
const adminFrom = jest.fn((table: string) => {
  if (table === 'recommendations') return { insert: insertMock }
  return { select: () => ({ order: () => ({ limit: () => ({ single: singleMock }) }) }) }
})
jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({ from: jest.fn(), rpc: jest.fn() }),
  createAdminClient: () => ({ from: adminFrom }),
}))

function makeReq(query: string) {
  return { nextUrl: new URL(`http://localhost/api/recommend?${query}`) } as never
}

beforeEach(() => {
  insertMock.mockClear().mockResolvedValue({ error: null })
  singleMock.mockClear().mockResolvedValue({ data: { game_no: 1230 } })
})

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

it('records the custom mode for the exclusions path', async () => {
  const res = await GET(makeReq('exclude=1,2,3'))
  expect(res.status).toBe(200)
  expect(insertMock).toHaveBeenCalledTimes(1)
  expect(insertMock.mock.calls[0][0].mode).toBe('custom')
})
