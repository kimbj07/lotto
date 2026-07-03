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
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ numbers: [1, 2, 3, 4, 5, 6] }) })
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
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ numbers: [1, 2, 3, 4, 5, 6] }) })
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
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ numbers: [1, 2, 3, 4, 5, 6] }) })
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
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ numbers: [4, 5, 6, 7, 8, 9] }) })
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
})
