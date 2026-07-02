import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import NavBar from '@/components/NavBar'
import PromoBanner from '@/components/PromoBanner'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/siteConfig'

const TITLE = '행운로또 — 로또 번호 추천'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: SITE_DESCRIPTION,
  // og:image / twitter:image are auto-wired by app/opengraph-image.tsx.
  openGraph: {
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  verification: {
    google: 'Fdw-YQBNevLCyoHyAmI7XJXZiHJFnr3fPVP2Pqi_Z6M',
    other: { 'naver-site-verification': '1f21a8e76799bfc497e373618e3f7c79186e3973' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <div
          aria-hidden
          className="pointer-events-none fixed -top-24 -left-24 w-96 h-96 rounded-full bg-amber-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed top-40 -right-24 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <NavBar />
        <main className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-12">
          {children}
        </main>
        <footer className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 pb-12">
          <PromoBanner />
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
