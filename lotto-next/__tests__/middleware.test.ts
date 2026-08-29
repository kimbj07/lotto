/** @jest-environment node */
import { NextRequest } from 'next/server'
import { middleware, _resetBuckets, MAX_PER_WINDOW, WINDOW_MS } from '../middleware'

function req(ip: string) {
  return new NextRequest('http://localhost/api/recommend?mode=random', {
    headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
  })
}

beforeEach(() => _resetBuckets())

describe('rate limit middleware (/api/recommend)', () => {
  it('allows MAX_PER_WINDOW requests then returns 429 with Retry-After', () => {
    const t0 = 1_000_000
    for (let i = 0; i < MAX_PER_WINDOW; i++) {
      expect(middleware(req('1.2.3.4'), t0).status).toBe(200)
    }
    const blocked = middleware(req('1.2.3.4'), t0 + 1000)
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0)
  })

  it('buckets are per IP and reset after the window', () => {
    const t0 = 1_000_000
    for (let i = 0; i < MAX_PER_WINDOW; i++) middleware(req('1.2.3.4'), t0)
    expect(middleware(req('5.6.7.8'), t0).status).toBe(200)
    expect(middleware(req('1.2.3.4'), t0).status).toBe(429)
    expect(middleware(req('1.2.3.4'), t0 + WINDOW_MS + 1).status).toBe(200)
  })
})
