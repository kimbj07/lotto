'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: '번호 추천' },
  { href: '/history', label: '당첨 이력' },
  { href: '/my-numbers', label: '내 번호 확인' },
  { href: '/stats', label: '번호 통계' },
  { href: '/results', label: '번호 추천 결과' },
]

function CloverLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="navclover" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#navclover)" />
      <path d="M24 24 C24 31 23 35 21 40" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <g fill="#fff">
        <path d="M0 0 C0 0 -9 -7 -9 -13 C-9 -16 -7 -18 -4 -18 C-2 -18 0 -16 0 -15 C0 -16 2 -18 4 -18 C7 -18 9 -16 9 -13 C9 -7 0 0 0 0 Z" transform="translate(24 22) rotate(45) scale(0.6)" />
        <path d="M0 0 C0 0 -9 -7 -9 -13 C-9 -16 -7 -18 -4 -18 C-2 -18 0 -16 0 -15 C0 -16 2 -18 4 -18 C7 -18 9 -16 9 -13 C9 -7 0 0 0 0 Z" transform="translate(24 22) rotate(135) scale(0.6)" />
        <path d="M0 0 C0 0 -9 -7 -9 -13 C-9 -16 -7 -18 -4 -18 C-2 -18 0 -16 0 -15 C0 -16 2 -18 4 -18 C7 -18 9 -16 9 -13 C9 -7 0 0 0 0 Z" transform="translate(24 22) rotate(225) scale(0.6)" />
        <path d="M0 0 C0 0 -9 -7 -9 -13 C-9 -16 -7 -18 -4 -18 C-2 -18 0 -16 0 -15 C0 -16 2 -18 4 -18 C7 -18 9 -16 9 -13 C9 -7 0 0 0 0 Z" transform="translate(24 22) rotate(315) scale(0.6)" />
      </g>
    </svg>
  )
}

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-black/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-1 sm:gap-2 overflow-x-auto">
        <Link href="/" className="flex items-center gap-2 mr-1 sm:mr-3 shrink-0">
          <CloverLogo />
          <span className="font-display text-xl text-gray-900 hidden sm:inline">행운로또</span>
        </Link>
        {LINKS.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 px-3 sm:px-3.5 py-2 rounded-full text-sm transition ${
                active
                  ? 'font-display bg-brand text-white'
                  : 'text-gray-500 hover:bg-black/5'
              }`}
            >
              {l.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
