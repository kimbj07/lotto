import type { MetadataRoute } from 'next'

const BASE_URL = 'https://lotto-two-delta.vercel.app'

// Generates /robots.txt — allow all crawlers, keep them off the API, and point
// to the sitemap so Google/Naver discover it automatically.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
