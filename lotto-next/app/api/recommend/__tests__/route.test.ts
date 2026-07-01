/** @jest-environment node */
import { GET } from '../route'
import { NextRequest } from 'next/server'

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
})
