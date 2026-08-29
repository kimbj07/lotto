import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import RecommenderClient from '../RecommenderClient'

// jsdom has no matchMedia; stub it. matches=true means "reduce motion", which
// makes the draw skip its 800ms min-spin so the functional tests stay instant.
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  })
}

describe('RecommenderClient', () => {
  const originalFetch = global.fetch
  beforeEach(() => { mockMatchMedia(true) })
  afterEach(() => { global.fetch = originalFetch })

  it('shows the description for the selected mode', () => {
    render(<RecommenderClient />)
    // default mode is stats
    expect(screen.getByText(/저빈도/)).toBeInTheDocument()
  })

  it('pickers are collapsed by default and expand on click', () => {
    render(<RecommenderClient />)
    const includeSection = screen.getByTestId('include-grid')
    // collapsed: number balls are not rendered
    expect(within(includeSection).queryByRole('button', { name: '7' })).toBeNull()
    // expand via the section header
    fireEvent.click(within(includeSection).getByRole('button', { name: /포함할 번호/ }))
    expect(within(includeSection).getByRole('button', { name: '7' })).toBeInTheDocument()
  })

  it('sends include/exclude params when numbers are picked', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ games: [[1, 2, 3, 4, 5, 6]] }) })
    global.fetch = fetchMock as unknown as typeof fetch
    render(<RecommenderClient />)

    // expand the collapsed include picker, then pick 7 (label 7 appears in both
    // grids, so scope to the include section by its testid container)
    const includeSection = screen.getByTestId('include-grid')
    fireEvent.click(within(includeSection).getByRole('button', { name: /포함할 번호/ }))
    fireEvent.click(within(includeSection).getByRole('button', { name: '7' }))

    fireEvent.click(screen.getByRole('button', { name: /번호 추천받기/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('include=7')
  })

  it('shows the Kakao share button after numbers are generated', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ games: [[1, 2, 3, 4, 5, 6]] }) })
    global.fetch = fetchMock as unknown as typeof fetch
    render(<RecommenderClient />)

    // no share button before a recommendation exists
    expect(screen.queryByRole('button', { name: /카카오톡으로 행운로또 공유하기/ })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /번호 추천받기/ }))
    expect(
      await screen.findByRole('button', { name: /카카오톡으로 행운로또 공유하기/ })
    ).toBeInTheDocument()
  })

  it('shows the drawing cage, then reveals the numbers', async () => {
    mockMatchMedia(false) // motion enabled → cage spins for the min-spin window
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ games: [[1, 2, 3, 4, 5, 6]] }) })
    global.fetch = fetchMock as unknown as typeof fetch
    render(<RecommenderClient />)

    fireEvent.click(screen.getByRole('button', { name: /번호 추천받기/ }))
    // the cage is shown immediately, before the fetch + min-spin resolve
    expect(screen.getByRole('status', { name: '번호 추첨 중' })).toBeInTheDocument()

    // once both finish, the cage is replaced by the revealed numbers
    expect(await screen.findByText(/당신의 행운 번호/)).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: '번호 추첨 중' })).toBeNull()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('sends exclude param when a number is excluded', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ games: [[4, 5, 6, 7, 8, 9]] }) })
    global.fetch = fetchMock as unknown as typeof fetch
    render(<RecommenderClient />)

    // expand the collapsed exclude picker, then pick 13
    const excludeSection = screen.getByTestId('exclude-grid')
    fireEvent.click(within(excludeSection).getByRole('button', { name: /제외할 번호/ }))
    fireEvent.click(within(excludeSection).getByRole('button', { name: '13' }))

    fireEvent.click(screen.getByRole('button', { name: /번호 추천받기/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('exclude=13')
  })

  describe('5등 노리기 (target5)', () => {
    const slip = [
      [1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12], [13, 14, 15, 16, 17, 18],
      [19, 20, 21, 22, 23, 24], [25, 26, 27, 28, 29, 30],
    ]

    it('requests mode=target5 and renders all 5 games with the odds chips', async () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ games: slip }) })
      global.fetch = fetchMock as unknown as typeof fetch
      render(<RecommenderClient />)

      fireEvent.click(screen.getByRole('button', { name: '5등 노리기' }))
      expect(screen.getByText(/겹치지 않게/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /5게임 추천받기/ }))

      const result = await screen.findByTestId('slip-result')
      expect(fetchMock.mock.calls[0][0] as string).toContain('mode=target5')
      expect(within(result).getAllByRole('listitem')).toHaveLength(5)
      // game labels are derived, A..E
      expect(within(result).getByText('A')).toBeInTheDocument()
      expect(within(result).getByText('E')).toBeInTheDocument()
      // exact figures from lib/recommendModes.ts, rounded to one decimal
      expect(within(result).getByText('이 배치 11.9%')).toBeInTheDocument()
      expect(within(result).getByText('랜덤 5게임 11.4%')).toBeInTheDocument()
      expect(within(result).getByText('1게임 2.4%')).toBeInTheDocument()
      expect(within(result).getByRole('button', { name: /카카오톡으로 행운로또 공유하기/ })).toBeInTheDocument()
    })

    it('renders the API error (role=alert) and no result when the draw is rejected', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'at most 15 exclude numbers allowed' }) }) as unknown as typeof fetch
      render(<RecommenderClient />)
      fireEvent.click(screen.getByRole('button', { name: '5등 노리기' }))
      fireEvent.click(screen.getByRole('button', { name: /5게임 추천받기/ }))
      expect(await screen.findByRole('alert')).toHaveTextContent('at most 15 exclude numbers allowed')
      expect(screen.queryByTestId('slip-result')).not.toBeInTheDocument()
    })

    it('shows a Korean fallback when the response is not JSON (gateway error page)', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => { throw new SyntaxError('Unexpected token <') } }) as unknown as typeof fetch
      render(<RecommenderClient />)
      fireEvent.click(screen.getByRole('button', { name: /번호 추천받기/ }))
      expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했어요')
    })

    it('rapid re-clicks during a draw fire exactly one fetch and one result', async () => {
      let resolveFetch!: (v: unknown) => void
      const fetchMock = jest.fn().mockReturnValue(new Promise((r) => { resolveFetch = r }))
      global.fetch = fetchMock as unknown as typeof fetch
      render(<RecommenderClient />)
      const btn = screen.getByRole('button', { name: /번호 추천받기/ })
      fireEvent.click(btn); fireEvent.click(btn); fireEvent.click(btn)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      resolveFetch({ ok: true, json: async () => ({ games: [[1, 2, 3, 4, 5, 6]] }) })
      expect(await screen.findByText(/당신의 행운 번호/)).toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('caps the exclude picker at 15 in target5 mode', () => {
      render(<RecommenderClient />)
      fireEvent.click(screen.getByRole('button', { name: '5등 노리기' }))
      const excludeSection = screen.getByTestId('exclude-grid')
      expect(within(excludeSection).getByText('0 / 15')).toBeInTheDocument()
    })

    it('trims excess excludes on switch and tells the user how many were dropped', () => {
      render(<RecommenderClient />)
      const excludeSection = screen.getByTestId('exclude-grid')
      fireEvent.click(within(excludeSection).getByRole('button', { name: /제외할 번호/ }))
      for (let n = 1; n <= 17; n++) {
        fireEvent.click(within(excludeSection).getByRole('button', { name: String(n) }))
      }
      expect(within(excludeSection).getByText('17 / 38')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: '5등 노리기' }))
      expect(within(excludeSection).getByText('15 / 15')).toBeInTheDocument()
      // few dropped → name them (16 and 17 were the last two clicked)
      expect(screen.getByRole('status')).toHaveTextContent('16·17번을 해제했어요')
    })

    it('re-clicking the active tab keeps the visible result', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ games: [[1, 2, 3, 4, 5, 6]] }) }) as unknown as typeof fetch
      render(<RecommenderClient />)
      fireEvent.click(screen.getByRole('button', { name: /번호 추천받기/ }))
      expect(await screen.findByText(/당신의 행운 번호/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '통계 기반' }))
      expect(screen.getByText(/당신의 행운 번호/)).toBeInTheDocument()
    })

    it('locks the mode tabs while a draw is in flight so a stale result cannot surface', async () => {
      let resolveFetch!: (v: unknown) => void
      const pending = new Promise((r) => { resolveFetch = r })
      global.fetch = jest.fn().mockReturnValue(pending) as unknown as typeof fetch
      render(<RecommenderClient />)

      fireEvent.click(screen.getByRole('button', { name: '5등 노리기' }))
      fireEvent.click(screen.getByRole('button', { name: /5게임 추천받기/ }))
      // in flight: every mode tab is disabled
      expect(screen.getByRole('button', { name: '랜덤' })).toBeDisabled()
      expect(screen.getByRole('button', { name: '5등 노리기' })).toBeDisabled()

      resolveFetch({ ok: true, json: async () => ({ games: slip, slipId: 'x' }) })
      expect(await screen.findByTestId('slip-result')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '랜덤' })).toBeEnabled()
    })
  })
})
