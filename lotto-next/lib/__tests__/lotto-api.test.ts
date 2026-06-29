import { parseLatestGameNo, parseGameInfo, fetchLatestGameNo, fetchGameInfo } from '../lotto-api'

describe('parseLatestGameNo', () => {
  it('extracts game number from HTML with lottoDrwNo element', () => {
    const html = '<html><strong id="lottoDrwNo">1178</strong></html>'
    expect(parseLatestGameNo(html)).toBe(1178)
  })

  it('returns 0 when element is not found', () => {
    const html = '<html>no element here</html>'
    expect(parseLatestGameNo(html)).toBe(0)
  })
})

describe('parseGameInfo', () => {
  it('maps API JSON fields to GameInfo', () => {
    const json = {
      returnValue: 'success',
      drwNo: 1,
      drwNoDate: '2002-12-07',
      drwtNo1: 10, drwtNo2: 23, drwtNo3: 29,
      drwtNo4: 33, drwtNo5: 37, drwtNo6: 40,
      bnusNo: 16,
      firstPrzwnerCo: 3,
      firstWinamnt: 2000000000,
      totFirstPrzamnt: 6000000000,
      secondPrzwnerCo: 0, secondWinamnt: 0, totSecondPrzamnt: 0,
      thirdPrzwnerCo: 0, thirdWinamnt: 0, totThirdPrzamnt: 0,
      fourthPrzwnerCo: 0, fourthWinamnt: 0, totFourthPrzamnt: 0,
      fifthPrzwnerCo: 0, fifthWinamnt: 0, totFifthPrzamnt: 0,
      totPrzwnerCo: 3, totPrzamnt: 6000000000, totSellamnt: 20000000000,
    }
    const result = parseGameInfo(json)
    expect(result).not.toBeNull()
    expect(result!.game_no).toBe(1)
    expect(result!.game_date).toBe('2002-12-07')
    expect(result!.first_ball).toBe(10)
    expect(result!.sixth_ball).toBe(40)
    expect(result!.bonus_ball).toBe(16)
    expect(result!.first_winner_count).toBe(3)
  })

  it('returns null when returnValue is not success', () => {
    const json = { returnValue: 'fail' }
    expect(parseGameInfo(json)).toBeNull()
  })
})

describe('fetch functions', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('fetchLatestGameNo calls correct URL with IE UA', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => '<strong id="lottoDrwNo">1149</strong>',
    })
    const result = await fetchLatestGameNo()
    expect(result).toBe(1149)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://dhlottery.co.kr/common.do?method=main',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
        }),
      })
    )
  })

  it('fetchGameInfo returns GameInfo for valid game', async () => {
    const mockJson = { returnValue: 'success', drwNo: 1149, drwNoDate: '2024-01-06',
      drwtNo1: 3, drwtNo2: 14, drwtNo3: 18, drwtNo4: 27, drwtNo5: 40, drwtNo6: 43, bnusNo: 31,
      firstWinamnt: 1000000000, firstPrzwnerCo: 5, firstAccumamnt: 5000000000,
      secondWinamnt: 0, secondPrzwnerCo: 0, secondAccumamnt: 0,
      thirdWinamnt: 0, thirdPrzwnerCo: 0, thirdAccumamnt: 0,
      fourthWinamnt: 0, fourthPrzwnerCo: 0, fourthAccumamnt: 0,
      fifthWinamnt: 0, fifthPrzwnerCo: 0, fifthAccumamnt: 0,
      totSellamnt: 100000000, autoShedCnt: 100, mecoShedCnt: 10 }
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockJson,
    })
    const result = await fetchGameInfo(1149)
    expect(result.game_no).toBe(1149)
    expect(result.first_ball).toBe(3)
  })
})
