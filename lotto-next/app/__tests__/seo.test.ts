import sitemap from '../sitemap'
import robots from '../robots'

const BASE = 'https://lotto-two-delta.vercel.app'

describe('sitemap', () => {
  it('lists all public pages with the canonical base URL', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls).toEqual([
      BASE,
      `${BASE}/history`,
      `${BASE}/my-numbers`,
      `${BASE}/stats`,
      `${BASE}/results`,
    ])
  })

  it('gives the home page top priority', () => {
    const root = sitemap().find((e) => e.url === BASE)
    expect(root?.priority).toBe(1)
  })
})

describe('robots', () => {
  it('allows all crawlers, blocks /api, and points to the sitemap', () => {
    const r = robots()
    expect(r.rules).toEqual({ userAgent: '*', allow: '/', disallow: '/api/' })
    expect(r.sitemap).toBe(`${BASE}/sitemap.xml`)
  })
})
