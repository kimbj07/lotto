import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import RecommenderClient from '../RecommenderClient'

describe('RecommenderClient', () => {
  const originalFetch = global.fetch
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
