import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = '행운로또 — 로또 번호 추천'

const LEAF =
  'M0 0 C0 0 -9 -7 -9 -13 C-9 -16 -7 -18 -4 -18 C-2 -18 0 -16 0 -15 C0 -16 2 -18 4 -18 C7 -18 9 -16 9 -13 C9 -7 0 0 0 0 Z'

// Satori (next/og's engine) can't use system fonts, so Korean needs an embedded
// font. We vendor Jua (Google Fonts, OFL) subset to only the glyphs this image
// renders (app/fonts/Jua-og.ttf, ~14KB) and read it from disk — this route is
// statically generated at build time, so a local read keeps the build free of
// any network dependency on fonts.googleapis.com.
export default async function OpengraphImage() {
  const fontData = await readFile(join(process.cwd(), 'app/fonts/Jua-og.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #fffbeb 0%, #f0fdf4 55%, #ecfeff 100%)',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Amber glow blob — top-left */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: -80,
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'rgba(251, 191, 36, 0.22)',
          }}
        />

        {/* Emerald glow blob — bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'rgba(52, 211, 153, 0.22)',
          }}
        />

        {/* Soft teal blob — top-right corner */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: 200,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.12)',
          }}
        />

        {/* Centre content column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            zIndex: 1,
          }}
        >
          {/* Clover logo mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 128,
              height: 128,
              borderRadius: 30,
              background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
              boxShadow: '0 24px 48px -12px rgba(16, 185, 129, 0.55)',
              marginBottom: 32,
            }}
          >
            <svg width="92" height="92" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 24 C24 31 23 35 21 40"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <g fill="#ffffff">
                <path d={LEAF} transform="translate(24 22) rotate(45) scale(0.6)" />
                <path d={LEAF} transform="translate(24 22) rotate(135) scale(0.6)" />
                <path d={LEAF} transform="translate(24 22) rotate(225) scale(0.6)" />
                <path d={LEAF} transform="translate(24 22) rotate(315) scale(0.6)" />
              </g>
            </svg>
          </div>

          {/* App title */}
          <div
            style={{
              fontFamily: 'Jua',
              fontSize: 88,
              fontWeight: 400,
              color: '#111827',
              lineHeight: 1,
              marginBottom: 20,
            }}
          >
            행운로또
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontFamily: 'Jua',
              fontSize: 30,
              color: '#6b7280',
              marginBottom: 40,
              letterSpacing: '0.04em',
            }}
          >
            로또 번호 추천 · 당첨 이력 · 번호 통계
          </div>

          {/* Gold CTA badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(to bottom, #FBBF24, #F59E0B)',
              borderRadius: 9999,
              paddingTop: 14,
              paddingBottom: 14,
              paddingLeft: 40,
              paddingRight: 40,
              boxShadow: '0 12px 28px -8px rgba(245, 158, 11, 0.65)',
            }}
          >
            <span
              style={{
                fontFamily: 'Jua',
                fontSize: 26,
                color: '#1f2937',
              }}
            >
              무료로 번호 추천받기
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Jua',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  )
}
