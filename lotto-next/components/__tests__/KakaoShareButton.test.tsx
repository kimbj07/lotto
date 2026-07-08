import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import KakaoShareButton from '../KakaoShareButton'

// NEXT_PUBLIC_KAKAO_JS_KEY is unset in the test env, so the SDK <Script> never
// renders — we drive the share logic by controlling window.Kakao directly.
type TestWindow = typeof window & { Kakao?: unknown }

describe('KakaoShareButton', () => {
  const w = window as TestWindow
  const originalKakao = w.Kakao
  let writeText: jest.Mock

  beforeEach(() => {
    writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })
  afterEach(() => {
    w.Kakao = originalKakao
    jest.clearAllMocks()
  })

  const clickShare = () =>
    fireEvent.click(screen.getByRole('button', { name: /카카오톡으로 행운로또 공유하기/ }))

  it('renders the share button', () => {
    render(<KakaoShareButton />)
    expect(
      screen.getByRole('button', { name: /카카오톡으로 행운로또 공유하기/ })
    ).toBeInTheDocument()
  })

  it('copies the link (with message) as a fallback when Kakao is unavailable', async () => {
    w.Kakao = undefined
    render(<KakaoShareButton />)
    clickShare()
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(writeText.mock.calls[0][0]).toContain('luck-lotto.vercel.app')
    expect(await screen.findByText('링크 복사됨!')).toBeInTheDocument()
  })

  it('uses sendDefault feed with a STATIC image + site link when initialized', async () => {
    const sendDefault = jest.fn()
    w.Kakao = { isInitialized: () => true, init: jest.fn(), Share: { sendDefault } }
    render(<KakaoShareButton />)
    clickShare()
    await waitFor(() => expect(sendDefault).toHaveBeenCalledTimes(1))
    const arg = sendDefault.mock.calls[0][0] as {
      objectType: string
      content: { imageUrl: string; link: { webUrl: string } }
    }
    expect(arg.objectType).toBe('feed')
    // static file, NOT the dynamic /opengraph-image route (which Kakao drops)
    expect(arg.content.imageUrl).toBe('https://luck-lotto.vercel.app/og-image.png')
    // NON-bare link: Kakao resolves a bare domain to a dead numeric did, so the
    // shared card must carry a URL with a query string for the tap to open the site.
    expect(arg.content.link.webUrl).toBe(
      'https://luck-lotto.vercel.app/?utm_source=kakao&utm_medium=share'
    )
    expect(arg.content.link.webUrl).not.toBe('https://luck-lotto.vercel.app')
    expect(writeText).not.toHaveBeenCalled()
  })
})
