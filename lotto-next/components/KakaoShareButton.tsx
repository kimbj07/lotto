'use client'

import { useCallback, useState } from 'react'
import Script from 'next/script'
import { SITE_URL, SITE_NAME } from '@/lib/siteConfig'

// Kakao JS SDK, pinned + Subresource-Integrity-checked. Only loaded when a public
// app key is configured; without it the button degrades to a copy-link fallback.
const KAKAO_SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js'
const KAKAO_SDK_INTEGRITY =
  'sha384-dok87au0gKqJdxs7msEdBPNnKSRT+/mhTVzq+qOhcL464zXwvcrpjeWvyj1kCdq6'
// The JavaScript key is public by design (embedded in client code).
const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY

const SHARE_MESSAGE =
  '🍀 행운로또에서 오늘의 행운 번호를 뽑아보세요! 로또 번호 추천부터 당첨 이력, 통계까지 무료로.'
// STATIC image, not the dynamic /opengraph-image route: Kakao's card scraper
// silently drops the dynamic route (chunked, no Content-Length) and falls back to
// its default placeholder, which also breaks the card's link. A static file in
// /public serves with a Content-Length and works (matches the sister mengsaju app).
const KAKAO_IMAGE = `${SITE_URL}/og-image.png`

// The Kakao SDK attaches itself to window at runtime; type only what we call.
type KakaoSdk = {
  isInitialized: () => boolean
  init: (key: string) => void
  Share: {
    sendDefault: (settings: unknown) => void
  }
}
declare global {
  interface Window {
    Kakao?: KakaoSdk
  }
}

function initKakao() {
  const Kakao = window.Kakao
  if (Kakao && KAKAO_KEY && !Kakao.isInitialized()) Kakao.init(KAKAO_KEY)
}

export default function KakaoShareButton() {
  const [copied, setCopied] = useState(false)

  const share = useCallback(async () => {
    const Kakao = window.Kakao
    if (Kakao?.isInitialized?.()) {
      try {
        Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `${SITE_NAME} — 오늘의 행운 번호 🍀`,
            description: SHARE_MESSAGE,
            imageUrl: KAKAO_IMAGE,
            link: { mobileWebUrl: SITE_URL, webUrl: SITE_URL },
          },
          buttons: [
            { title: '번호 추천받기', link: { mobileWebUrl: SITE_URL, webUrl: SITE_URL } },
          ],
        })
        return
      } catch {
        // Kakao send failed — fall through to copy.
      }
    }
    // Fallback: Kakao unavailable (key unset, SDK blocked, or send failed).
    try {
      await navigator.clipboard.writeText(`${SHARE_MESSAGE}\n${SITE_URL}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — nothing more we can do */
    }
  }, [])

  return (
    <>
      {KAKAO_KEY && (
        <Script
          src={KAKAO_SDK_SRC}
          integrity={KAKAO_SDK_INTEGRITY}
          crossOrigin="anonymous"
          strategy="afterInteractive"
          onLoad={initKakao}
        />
      )}
      <button
        type="button"
        onClick={share}
        aria-label="카카오톡으로 행운로또 공유하기"
        className="inline-flex items-center gap-2 rounded-full bg-[#FEE500] px-5 py-2.5 text-sm font-medium text-[#3A1D1D] shadow-sm transition hover:brightness-95 active:scale-95"
      >
        {copied ? (
          '링크 복사됨!'
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 256 256" aria-hidden="true">
              <path
                fill="#3A1D1D"
                d="M128 36C70.6 36 24 72.9 24 118.4c0 29.4 19.6 55.2 49 69.6-1.6 5.6-8.6 30-8.9 31.9 0 0-.2 1.5.8 2.1.9.6 2.2.2 2.2.2 2.6-.4 30.1-19.7 34.9-23.1 8.2 1.2 16.6 1.8 25 1.8 57.4 0 104-36.9 104-82.4S185.4 36 128 36z"
              />
            </svg>
            카카오톡 공유
          </>
        )}
      </button>
    </>
  )
}
