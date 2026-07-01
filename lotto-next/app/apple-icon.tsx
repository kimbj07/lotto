import { ImageResponse } from 'next/og'

// iOS home-screen icon. Next generates a PNG from this JSX at build time.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 30%, #FEF08A 0%, #FACC15 55%, #EAB308 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 78,
            fontWeight: 800,
            color: '#7C3AED',
          }}
        >
          7
        </div>
      </div>
    ),
    { ...size }
  )
}
