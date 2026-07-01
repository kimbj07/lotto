import { render, screen } from '@testing-library/react'
import ResultsClient from '../ResultsClient'

function summary(over: object = {}) {
  return {
    allTime: { total: 20, graded_count: 20, rank1: 1, rank2: 0, rank3: 0, rank4: 1, rank5: 6 },
    rounds: [
      { target_game_no: 100, total: 10, graded_count: 10, rank1: 1, rank2: 0, rank3: 0, rank4: 1, rank5: 3 },
      { target_game_no: 101, total: 10, graded_count: 5, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 3 },
    ],
    byMode: [
      { mode: 'stats', total: 10, graded_count: 10, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 1 }, // 10.0%
      { mode: 'exception', total: 8, graded_count: 8, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 }, // 0.0%
      { mode: 'random', total: 0, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 }, // 아직 번호 추천 없음
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
    expect(await screen.findByText('아직 집계된 번호 추천 결과가 없습니다 🍀')).toBeInTheDocument()
  })

  it('surfaces an API error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: '서버 오류' }),
    }) as unknown as typeof fetch
    render(<ResultsClient />)
    expect(await screen.findByText('서버 오류')).toBeInTheDocument()
  })

  it('notes pending rounds are included in the all-time totals', async () => {
    // all-time is not fully graded (15 of 20) → show the "집계 예정 포함" note
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => summary({ allTime: { total: 20, graded_count: 15, rank1: 1, rank2: 0, rank3: 0, rank4: 1, rank5: 6 } }),
    }) as unknown as typeof fetch
    render(<ResultsClient />)
    expect(await screen.findByText('일부 회차 집계 예정 포함')).toBeInTheDocument()
  })

  it('renders the per-mode win-rate breakdown', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => summary() }) as unknown as typeof fetch
    render(<ResultsClient />)
    expect(await screen.findByText('모드별 승률')).toBeInTheDocument()
    expect(screen.getByText('통계 기반')).toBeInTheDocument()
    expect(screen.getByText('10.0%')).toBeInTheDocument() // stats: 1 win / 10 graded
    expect(screen.getByText('0.0%')).toBeInTheDocument()  // exception: 0 / 8 graded
    expect(screen.getByText('아직 번호 추천 없음')).toBeInTheDocument() // random: 0 picks
  })

  it('shows 집계 예정 for a mode with picks but none graded yet', async () => {
    const data = summary({
      rounds: [{ target_game_no: 100, total: 10, graded_count: 10, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 1 }],
      byMode: [{ mode: 'stats', total: 5, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 }],
    })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => data }) as unknown as typeof fetch
    render(<ResultsClient />)
    // the round is fully graded, so the only 집계 예정 badge comes from the stats mode
    expect(await screen.findByText('집계 예정')).toBeInTheDocument()
  })
})
