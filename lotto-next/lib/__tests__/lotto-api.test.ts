import {
  formatDrawDate,
  parseLt645Entry,
  fetchLatestGameNo,
  fetchGameInfo,
  fetchGameInfoWindow,
} from '../lotto-api'

const UA = 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)'

// A representative raw lt645 entry as returned by dhlottery.co.kr.
function rawEntry(ltEpsd: number) {
  return {
    ltEpsd,
    ltRflYmd: '20240127',
    tm1WnNo: 1, tm2WnNo: 7, tm3WnNo: 21, tm4WnNo: 30, tm5WnNo: 35, tm6WnNo: 38,
    bnsWnNo: 2,
    rnk1WnAmt: 1817193100, rnk1WnNope: 15, rnk1SumWnAmt: 27257896500,
    rnk2WnAmt: 59776089, rnk2WnNope: 76, rnk2SumWnAmt: 4542982764,
    rnk3WnAmt: 1514328, rnk3WnNope: 3000, rnk3SumWnAmt: 4542984000,
    rnk4WnAmt: 50000, rnk4WnNope: 148589, rnk4SumWnAmt: 7429450000,
    rnk5WnAmt: 5000, rnk5WnNope: 2490276, rnk5SumWnAmt: 12451380000,
    sumWnNope: 2641956,
    rlvtEpsdSumNtslAmt: 56224692000,
  }
}

describe('formatDrawDate', () => {
  it('converts YYYYMMDD to YYYY-MM-DD', () => {
    expect(formatDrawDate('20240127')).toBe('2024-01-27')
    expect(formatDrawDate(20240127)).toBe('2024-01-27')
  })

  it('passes already-dashed dates through', () => {
    expect(formatDrawDate('2024-01-27')).toBe('2024-01-27')
  })
})

describe('parseLt645Entry', () => {
  it('maps raw lt645 fields to snake_case GameInfo', () => {
    const g = parseLt645Entry(rawEntry(1104))
    expect(g.game_no).toBe(1104)
    expect(g.game_date).toBe('2024-01-27')
    expect(g.first_ball).toBe(1)
    expect(g.sixth_ball).toBe(38)
    expect(g.bonus_ball).toBe(2)
    expect(g.first_winner_amount).toBe(1817193100)
    expect(g.first_winner_count).toBe(15)
    expect(g.total_first_winner_amount).toBe(27257896500)
    expect(g.total_winner_count).toBe(2641956)
    expect(g.total_sell_amount).toBe(56224692000)
  })

  it('sums rank totals into total_amount', () => {
    const g = parseLt645Entry(rawEntry(1104))
    expect(g.total_amount).toBe(
      27257896500 + 4542982764 + 4542984000 + 7429450000 + 12451380000
    )
  })

  it('defaults missing prize fields to 0', () => {
    const g = parseLt645Entry({
      ltEpsd: 1, ltRflYmd: '20021207',
      tm1WnNo: 10, tm2WnNo: 23, tm3WnNo: 29, tm4WnNo: 33, tm5WnNo: 37, tm6WnNo: 40,
      bnsWnNo: 16,
    })
    expect(g.first_winner_amount).toBe(0)
    expect(g.total_amount).toBe(0)
    expect(g.manual_winner_count).toBe(0)
    expect(g.auto_winner_count).toBe(0)
  })
})

describe('fetch functions', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('fetchLatestGameNo returns the max ltEpsd from selectMainInfo with IE UA', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { result: { pstLtEpstInfo: { lt645: [
          { ltEpsd: 1227 }, { ltEpsd: 1230 }, { ltEpsd: 1226 },
        ] } } },
      }),
    })
    const result = await fetchLatestGameNo()
    expect(result).toBe(1230)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.dhlottery.co.kr/selectMainInfo.do',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': UA }),
      })
    )
  })

  it('fetchGameInfoWindow maps every entry in the window', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { list: [rawEntry(1099), rawEntry(1100), rawEntry(1101)] } }),
    })
    const result = await fetchGameInfoWindow(1100)
    expect(result).toHaveLength(3)
    expect(result.map((g) => g.game_no)).toEqual([1099, 1100, 1101])
  })

  it('fetchGameInfo picks the requested draw out of the window', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { list: [rawEntry(1099), rawEntry(1100), rawEntry(1101)] } }),
    })
    const result = await fetchGameInfo(1100)
    expect(result.game_no).toBe(1100)
    expect(result.first_ball).toBe(1)
  })

  it('fetchGameInfo throws when the draw is not in the window', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { list: [] } }),
    })
    await expect(fetchGameInfo(99999)).rejects.toThrow('No data for game 99999')
  })
})
