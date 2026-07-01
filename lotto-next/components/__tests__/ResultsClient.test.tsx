import { render, screen, waitFor } from '@testing-library/react'
import ResultsClient from '../ResultsClient'

function summary(over: object = {}) {
  return {
    allTime: { total: 20, graded_count: 20, rank1: 1, rank2: 0, rank3: 0, rank4: 1, rank5: 6 },
    rounds: [
      { target_game_no: 100, total: 10, graded_count: 10, rank1: 1, rank2: 0, rank3: 0, rank4: 1, rank5: 3 },
      { target_game_no: 101, total: 10, graded_count: 5, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 3 },
    ],
    ...over,
  }
}

describe('ResultsClient', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it('renders the all-time card and per-round cards', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => summary() }) as unknown as typeof fetch
    render(<ResultsClient />)
    expect(await screen.findByText('전체 누적')).toBeInTheDocument()
    expect(screen.getByText('100회차')).toBeInTheDocument()
    expect(screen.getByText('101회차')).toBeInTheDocument()
    // round 101 is not fully graded → pending badge
    expect(screen.getByText('집계 예정')).toBeInTheDocument()
  })

  it('shows an empty state when there are no rounds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ allTime: { total: 0, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 }, rounds: [] }),
    }) as unknown as typeof fetch
    render(<ResultsClient />)
    expect(await screen.findByText('아직 집계된 번추 결과가 없습니다 🍀')).toBeInTheDocument()
  })
})
