import { NextRequest, NextResponse } from 'next/server'

// Per-IP rate limit on the one public endpoint that WRITES (each call records
// 1 row, 5 for target5) — there was none anywhere in the app.
//
// Stated limit: this is a speed bump, not a wall. The bucket lives in the
// memory of one edge instance, so it resets on cold start and is not shared
// between instances or regions; a distributed or IP-rotating client gets
// past it. It stops the casual `curl` loop that would otherwise fill the
// free-tier DB and skew /results. A durable limiter needs shared state
// (@upstash/ratelimit) or the platform firewall.
export const config = { matcher: '/api/recommend' }

export const WINDOW_MS = 60_000
export const MAX_PER_WINDOW = 20

const buckets = new Map<string, { n: number; reset: number }>()

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

export function middleware(req: NextRequest, now = Date.now()) {
  const ip = clientIp(req)
  const b = buckets.get(ip)
  if (!b || now > b.reset) {
    buckets.set(ip, { n: 1, reset: now + WINDOW_MS })
  } else if (++b.n > MAX_PER_WINDOW) {
    return NextResponse.json(
      { error: '요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((b.reset - now) / 1000)) } }
    )
  }
  // Opportunistic cleanup so the map can't grow without bound.
  if (buckets.size > 10_000) {
    buckets.forEach((v, k) => { if (now > v.reset) buckets.delete(k) })
  }
  return NextResponse.next()
}

// Test hook.
export function _resetBuckets() { buckets.clear() }
