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

  it('sends include/exclude params when numbers are picked', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ numbers: [1, 2, 3, 4, 5, 6] }) })
    global.fetch = fetchMock as unknown as typeof fetch
    render(<RecommenderClient />)

    // pick include 7 (include grid is the first grid; label 7 appears in both grids,
    // so scope to the include section by its heading container)
    const includeSection = screen.getByTestId('include-grid')
    fireEvent.click(within(includeSection).getByRole('button', { name: '7' }))

    fireEvent.click(screen.getByRole('button', { name: /번호 추천받기/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('include=7')
  })
})
