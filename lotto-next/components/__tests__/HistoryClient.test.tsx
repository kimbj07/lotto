import { render, screen, waitFor } from '@testing-library/react'
import HistoryClient from '../HistoryClient'

function game(game_no: number) {
  return { game_no, game_date: '2026-06-27', first_ball: 1, second_ball: 2, third_ball: 3, fourth_ball: 4, fifth_ball: 5, sixth_ball: 6, bonus_ball: 7, first_winner_amount: 1000, first_winner_count: 1 }
}

describe('HistoryClient', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('auto-loads the latest 5 draws on mount and shows the latest header', async () => {
    // jsdom has no fetch, so assign a mock rather than spy on an existing one.
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [game(1230), game(1229), game(1228), game(1227), game(1226)] }),
    })
    global.fetch = fetchMock as unknown as typeof fetch

    render(<HistoryClient />)

    // Exactly one request on mount, to the bounded latest-5 endpoint.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/history?order=DESC&count=5')

    // The "latest draws" header renders only for the default load.
    expect(await screen.findByText('🎉 최신 당첨 번호')).toBeInTheDocument()
    expect(screen.getByText('1230회')).toBeInTheDocument()
  })

  it('shows a friendly empty-state message when there are no draws', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch

    render(<HistoryClient />)

    expect(await screen.findByText('해당 범위의 당첨 이력이 없습니다 🔍')).toBeInTheDocument()
    // The default header is hidden when there are no results.
    expect(screen.queryByText('🎉 최신 당첨 번호')).not.toBeInTheDocument()
  })
})
