import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '로또 번호 추천',
  description: '로또 번호 추천 및 당첨 이력 확인 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b px-4 py-3 flex gap-6 text-sm font-medium">
          <a href="/" className="hover:text-yellow-600">번호 추천</a>
          <a href="/history" className="hover:text-yellow-600">당첨 이력</a>
          <a href="/my-numbers" className="hover:text-yellow-600">내 번호 확인</a>
          <a href="/stats" className="hover:text-yellow-600">번호 통계</a>
        </nav>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </body>
    </html>
  )
}
