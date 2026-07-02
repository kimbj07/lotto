import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteConfig'

// Generates /robots.txt — allow all crawlers, keep them off the API, and point
// to the sitemap so Google/Naver discover it automatically.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
