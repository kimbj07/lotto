import type { MetadataRoute } from 'next'

const BASE_URL = 'https://lotto-two-delta.vercel.app'

// Public pages (API routes are excluded). Generates /sitemap.xml.
const ROUTES = ['', '/history', '/my-numbers', '/stats', '/results'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))
}
