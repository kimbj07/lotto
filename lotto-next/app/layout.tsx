import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: '행운로또 — 로또 번호 추천',
  description: '로또 번호 추천, 당첨 이력, 내 번호 확인, 번호 통계 — 오늘의 행운 번호를 뽑아보세요',
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
