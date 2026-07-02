import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteConfig'

// Public pages (API routes are excluded). Generates /sitemap.xml.
const ROUTES = ['', '/history', '/my-numbers', '/stats', '/results'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))
}
