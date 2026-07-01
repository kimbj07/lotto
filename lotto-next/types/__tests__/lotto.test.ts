import type { GameInfo, AppearanceCount, MyRankInGame, RecommendMode } from '../lotto'

describe('lotto types', () => {
  it('GameInfo has all required fields', () => {
    const g: GameInfo = {
      game_no: 1, game_date: '2002-12-07',
      first_ball: 10, second_ball: 23, third_ball: 29,
      fourth_ball: 33, fifth_ball: 37, sixth_ball: 40,
      bonus_ball: 16,
      first_winner_amount: 0, first_winner_count: 0, total_first_winner_amount: 0,
      second_winner_amount: 0, second_winner_count: 0, total_second_winner_amount: 0,
      third_winner_amount: 0, third_winner_count: 0, total_third_winner_amount: 0,
      fourth_winner_amount: 0, fourth_winner_count: 0, total_fourth_winner_amount: 0,
      fifth_winner_amount: 0, fifth_winner_count: 0, total_fifth_winner_amount: 0,
      total_winner_count: 0, total_amount: 0, total_sell_amount: 0,
      manual_winner_count: 0, auto_winner_count: 0,
    }
    expect(g.game_no).toBe(1)
  })

  it('RecommendMode accepts only valid values', () => {
    const modes: RecommendMode[] = ['stats', 'exception', 'random']
    expect(modes).toHaveLength(3)
  })
})
