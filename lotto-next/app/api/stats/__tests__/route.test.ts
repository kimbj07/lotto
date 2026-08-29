/** @jest-environment node */
import { GET } from '../route'
import { NextRequest } from 'next/server'
import { GENERIC_ERROR } from '@/lib/apiError'

const rpcMock = jest.fn()
jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({ rpc: rpcMock }),
}))

const makeReq = (qs: string) => new NextRequest(`http://localhost/api/stats?${qs}`)

beforeEach(() => {
  rpcMock.mockReset().mockResolvedValue({ data: [{ number: 1, win_count: 2, bonus_count: 0, sum_count: 2 }], error: null })
})

describe('GET /api/stats', () => {
  it('rejects a negative count instead of forwarding LIMIT -1 to SQL', async () => {
    const res = await GET(makeReq('count=-1'))
    expect(res.status).toBe(400)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('rejects non-numeric from/to instead of silently dropping the filter', async () => {
    expect((await GET(makeReq('from=abc'))).status).toBe(400)
    expect((await GET(makeReq('from=10&to=5'))).status).toBe(400)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('rejects an unknown sortBy / order', async () => {
    expect((await GET(makeReq('sortBy=evil'))).status).toBe(400)
    expect((await GET(makeReq('order=sideways'))).status).toBe(400)
  })

  it('forwards validated params and sets a CDN cache header', async () => {
    const res = await GET(makeReq('from=1&to=100&sortBy=number&order=ASC&count=10'))
    expect(res.status).toBe(200)
    expect(rpcMock).toHaveBeenCalledWith('get_appearance_count', {
      p_from: 1, p_to: 100, p_sort_by: 'number', p_sort_order: 'ASC', p_count: 10,
    })
    expect(res.headers.get('Cache-Control')).toContain('s-maxage')
    expect((await res.json()).stats).toHaveLength(1)
  })

  it('hides the raw DB error', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'function get_appearance_count does not exist' } })
    const res = await GET(makeReq(''))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe(GENERIC_ERROR)
  })
})
