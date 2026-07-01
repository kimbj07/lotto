import { ImageResponse } from 'next/og'

// iOS home-screen icon. Next generates a PNG from this JSX at build time.
// Solid emerald fill (iOS applies its own rounded-corner mask) with the same
// white 4-leaf clover as app/icon.svg.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const LEAF =
  'M0 0 C0 0 -9 -7 -9 -13 C-9 -16 -7 -18 -4 -18 C-2 -18 0 -16 0 -15 C0 -16 2 -18 4 -18 C7 -18 9 -16 9 -13 C9 -7 0 0 0 0 Z'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#10B981',
        }}
      >
        <svg width="132" height="132" viewBox="0 0 48 48" fill="none">
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
    ),
    { ...size }
  )
}
