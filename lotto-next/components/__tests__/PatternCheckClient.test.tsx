import { render, screen, within } from '@testing-library/react'
import PatternCheckClient from '../PatternCheckClient'
import type { PatternReport } from '@/types/lotto'

const report: PatternReport = {
  draws: 1238, fromGameNo: 1, toGameNo: 1238, baseRate: 6 / 45, zThreshold: 2.5,
  tests: [
    { key: 'prev_bonus_repeat', hits: 169, trials: 1237, observed: 0.1366, expected: 6 / 45, z: 0.34, verdict: 'none' },
    { key: 'prev_main_repeat', hits: 1020, trials: 7422, observed: 0.1374, expected: 6 / 45, z: 1.04, verdict: 'none' },
    { key: 'cumulative_hot', hits: 730, trials: 5690, observed: 0.1283, expected: 6 / 45, z: -1.12, verdict: 'none' },
    { key: 'cumulative_cold', hits: 766, trials: 5690, observed: 0.1346, expected: 6 / 45, z: 0.29, verdict: 'none' },
    { key: 'recent_hot', hits: 2000, trials: 12180, observed: 0.1642, expected: 6 / 45, z: 3.5, verdict: 'more' },
  ],
  uniformity: { chi2: 29.4, df: 44, cutoff95: 53.6, expectedPerNumber: 165.1, sd: 12.7, uniform: true },
  mostFrequent: [{ number: 34, count: 186 }], leastFrequent: [{ number: 9, count: 136 }],
  splitHalfR: -0.314, splitHalfZ: -2.06, persistence: 'none',
}

describe('PatternCheckClient', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it('renders every hypothesis with its observed rate and verdict', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => report }) as unknown as typeof fetch
    render(<PatternCheckClient />)
    // the section renders immediately; wait for the fetched report to land
    expect(await screen.findByText(/1회 ~ 1238회/)).toBeInTheDocument()
    const section = screen.getByTestId('pattern-check')
    // sm+: the table; <sm: stacked cards. jsdom renders both (no CSS), so
    // assert each block separately.
    const table = within(section).getByRole('table')
    expect(within(table).getByText('지난 회차 보너스 번호가 이번 회차에 나온다')).toBeInTheDocument()
    expect(within(table).getByText('13.66%')).toBeInTheDocument()
    expect(within(table).getAllByText('차이 없음')).toHaveLength(4)
    expect(within(table).getByText('더 나옴')).toBeInTheDocument()
    const cards = within(section).getByTestId('pattern-cards')
    expect(within(cards).getAllByRole('listitem')).toHaveLength(5)
    expect(within(cards).getAllByText('차이 없음')).toHaveLength(4)
    // statistics are read out in plain Korean first, number in parens after
    expect(within(table).getAllByText(/우연 범위 안 \(z /)).toHaveLength(4)
    expect(within(section).getByText(/χ² 29.4, 기준 53.6/)).toBeInTheDocument()
    expect(within(section).getByText('이어지지 않음')).toBeInTheDocument()
    expect(within(section).getByText(/r -0.314, z -2.06/)).toBeInTheDocument()
    expect(within(section).getByText(/2.5σ/)).toBeInTheDocument()
    // this fixture has one 'more' verdict, so the conclusion hedges
    expect(within(section).getByText(/우연 범위를 벗어났지만/)).toBeInTheDocument()
    expect(within(section).getByText(/2.38%/)).toBeInTheDocument()
  })

  it('states there is no pattern when every verdict is none and the counts are uniform', async () => {
    const clean = { ...report, tests: report.tests.map(t => ({ ...t, verdict: 'none' as const, z: 0.5 })) }
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => clean }) as unknown as typeof fetch
    render(<PatternCheckClient />)
    expect(await screen.findByText(/활용할 수 있는 패턴은 없습니다/)).toBeInTheDocument()
  })

  it('shows the empty state and the error state', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ...report, draws: 0, tests: [] }) }) as unknown as typeof fetch
    render(<PatternCheckClient />)
    expect(await screen.findByText('아직 검증할 회차가 없습니다.')).toBeInTheDocument()

    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'boom' }) }) as unknown as typeof fetch
    render(<PatternCheckClient />)
    expect(await screen.findByRole('alert')).toHaveTextContent('boom')
  })
})
