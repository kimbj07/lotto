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

// Per-mode config (labels, game counts, exclude caps, odds) lives in
// lib/recommendModes.ts — this file stays type-only.
export type RecommendMode = 'stats' | 'exception' | 'random' | 'target5'

export type SortOrder = 'ASC' | 'DESC'

// /api/stats/patterns — folk-hypothesis checks against the full draw history
// (see lib/patterns.ts). `verdict` is 'none' when |z| < 2.
export interface PatternTest {
  key: string
  hits: number
  trials: number
  observed: number   // hits / trials
  expected: number   // base rate 6/45
  z: number
  verdict: 'none' | 'more' | 'less'
}

export interface PatternReport {
  draws: number
  fromGameNo: number
  toGameNo: number
  baseRate: number
  zThreshold: number // |z| below this reads as 'none' (2.5: ~7 statistics shown at once)
  tests: PatternTest[]
  uniformity: {
    chi2: number
    df: number
    cutoff95: number
    expectedPerNumber: number
    sd: number
    uniform: boolean
  }
  mostFrequent: { number: number; count: number }[]
  leastFrequent: { number: number; count: number }[]
  // First-half vs second-half correlation of per-number counts, its z under
  // independence (sd ≈ 1/√43), and the verdict on the shared threshold.
  splitHalfR: number
  splitHalfZ: number
  persistence: 'none' | 'more' | 'less'
}

export type AppearanceSortBy = 'winCount' | 'bonusCount' | 'sumCount' | 'number'

export interface RecommendationRoundSummary {
  target_game_no: number
  total: number
  graded_count: number
  rank1: number
  rank2: number
  rank3: number
  rank4: number
  rank5: number
}

export interface RecommendationModeSummary {
  mode: string
  total: number
  graded_count: number
  rank1: number
  rank2: number
  rank3: number
  rank4: number
  rank5: number
  // Slip-level stats (migration 008): only populated for modes that record
  // multi-game slips (target5). A slip "hits" when any of its games ranks.
  slip_total?: number
  slip_graded?: number
  slip_hit?: number
}

export interface RecommendationSummary {
  allTime: {
    total: number
    graded_count: number
    rank1: number
    rank2: number
    rank3: number
    rank4: number
    rank5: number
  }
  rounds: RecommendationRoundSummary[]
  byMode: RecommendationModeSummary[]
}
