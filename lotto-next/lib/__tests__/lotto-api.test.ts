import { parseLatestGameNo, parseGameInfo } from '../lotto-api'

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
