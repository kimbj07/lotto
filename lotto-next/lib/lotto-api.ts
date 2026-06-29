import type { GameInfo } from '@/types/lotto'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; MAAU; .NET4.0C; .NET4.0E; InfoPath.2; rv:11.0) like Gecko'

const BASE_URL = 'https://dhlottery.co.kr/common.do'

// Exported for unit testing without network calls
export function parseLatestGameNo(html: string): number {
  const match = html.match(/<strong id="lottoDrwNo">(\d+)<\/strong>/)
  if (!match) return 0
  return parseInt(match[1], 10)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGameInfo(json: any): GameInfo | null {
  if (json?.returnValue !== 'success') return null
  return {
    game_no: json.drwNo,
    game_date: json.drwNoDate,
    first_ball: json.drwtNo1,
    second_ball: json.drwtNo2,
    third_ball: json.drwtNo3,
    fourth_ball: json.drwtNo4,
    fifth_ball: json.drwtNo5,
    sixth_ball: json.drwtNo6,
    bonus_ball: json.bnusNo,
    first_winner_amount: json.firstWinamnt ?? 0,
    first_winner_count: json.firstPrzwnerCo ?? 0,
    total_first_winner_amount: json.totFirstPrzamnt ?? 0,
    second_winner_amount: json.secondWinamnt ?? 0,
    second_winner_count: json.secondPrzwnerCo ?? 0,
    total_second_winner_amount: json.totSecondPrzamnt ?? 0,
    third_winner_amount: json.thirdWinamnt ?? 0,
    third_winner_count: json.thirdPrzwnerCo ?? 0,
    total_third_winner_amount: json.totThirdPrzamnt ?? 0,
    fourth_winner_amount: json.fourthWinamnt ?? 0,
    fourth_winner_count: json.fourthPrzwnerCo ?? 0,
    total_fourth_winner_amount: json.totFourthPrzamnt ?? 0,
    fifth_winner_amount: json.fifthWinamnt ?? 0,
    fifth_winner_count: json.fifthPrzwnerCo ?? 0,
    total_fifth_winner_amount: json.totFifthPrzamnt ?? 0,
    total_winner_count: json.totPrzwnerCo ?? 0,
    total_amount: json.totPrzamnt ?? 0,
    total_sell_amount: json.totSellamnt ?? 0,
    manual_winner_count: 0,
    auto_winner_count: 0,
  }
}

export async function getLatestGameNo(): Promise<number> {
  const res = await fetch(`${BASE_URL}?method=main`, {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  })
  const html = await res.text()
  return parseLatestGameNo(html)
}

export async function fetchGameInfo(gameNo: number): Promise<GameInfo | null> {
  const res = await fetch(`${BASE_URL}?method=getLottoNumber&drwNo=${gameNo}`, {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  })
  const json = await res.json()
  return parseGameInfo(json)
}
