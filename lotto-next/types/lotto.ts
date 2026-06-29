export interface GameInfo {
  game_no: number
  game_date: string          // 'YYYY-MM-DD'
  first_ball: number
  second_ball: number
  third_ball: number
  fourth_ball: number
  fifth_ball: number
  sixth_ball: number
  bonus_ball: number
  first_winner_amount: number
  first_winner_count: number
  total_first_winner_amount: number
  second_winner_amount: number
  second_winner_count: number
  total_second_winner_amount: number
  third_winner_amount: number
  third_winner_count: number
  total_third_winner_amount: number
  fourth_winner_amount: number
  fourth_winner_count: number
  total_fourth_winner_amount: number
  fifth_winner_amount: number
  fifth_winner_count: number
  total_fifth_winner_amount: number
  total_winner_count: number
  total_amount: number
  total_sell_amount: number
  manual_winner_count: number
  auto_winner_count: number
}

export interface AppearanceCount {
  number: number
  win_count: number
  bonus_count: number
  sum_count: number
}

export interface MyRankInGame {
  game_no: number
  win_number_count: number
  bonus_number_count: number
  rank: 1 | 2 | 3 | 4 | 5 | null
}

export type RecommendMode = 'stats' | 'exception' | 'random'

export type SortOrder = 'ASC' | 'DESC'

export type AppearanceSortBy = 'winCount' | 'bonusCount' | 'sumCount' | 'number'
