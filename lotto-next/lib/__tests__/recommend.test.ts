import {
  recommendRandom,
  recommendWithExclusions,
  recommendStats,
  recommendException,
} from '../recommend'
import type { GameInfo, AppearanceCount } from '@/types/lotto'

function makeGame(gameNo: number, balls: number[], bonus: number): GameInfo {
  return {
    game_no: gameNo, game_date: '2024-01-01',
    first_ball: balls[0], second_ball: balls[1], third_ball: balls[2],
    fourth_ball: balls[3], fifth_ball: balls[4], sixth_ball: balls[5],
    bonus_ball: bonus,
    first_winner_amount: 0, first_winner_count: 0, total_first_winner_amount: 0,
    second_winner_amount: 0, second_winner_count: 0, total_second_winner_amount: 0,
    third_winner_amount: 0, third_winner_count: 0, total_third_winner_amount: 0,
    fourth_winner_amount: 0, fourth_winner_count: 0, total_fourth_winner_amount: 0,
    fifth_winner_amount: 0, fifth_winner_count: 0, total_fifth_winner_amount: 0,
    total_winner_count: 0, total_amount: 0, total_sell_amount: 0,
    manual_winner_count: 0, auto_winner_count: 0,
  }
}

function makeCounts(): AppearanceCount[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    win_count: 45 - i,
    bonus_count: 1,
    sum_count: 46 - i,
  }))
}

describe('recommendRandom', () => {
  it('returns exactly 6 unique numbers between 1 and 45', () => {
    const result = recommendRandom()
    expect(result).toHaveLength(6)
    expect(new Set(result).size).toBe(6)
    result.forEach(n => expect(n).toBeGreaterThanOrEqual(1))
    result.forEach(n => expect(n).toBeLessThanOrEqual(45))
    // verify sorted ascending
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i]).toBeLessThan(result[i + 1])
    }
  })
})

describe('recommendWithExclusions', () => {
  it('returns 6 numbers not in exclusion list', () => {
    const exclude = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = recommendWithExclusions(exclude)
    expect(result).toHaveLength(6)
    result.forEach(n => expect(exclude).not.toContain(n))
    // verify sorted ascending
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i]).toBeLessThan(result[i + 1])
    }
  })

  it('throws when too many numbers excluded', () => {
    const exclude = Array.from({ length: 40 }, (_, i) => i + 1)
    expect(() => recommendWithExclusions(exclude)).toThrow()
  })
})

describe('recommendStats', () => {
  it('returns exactly 6 unique numbers in 1-45', () => {
    const games = Array.from({ length: 10 }, (_, i) =>
      makeGame(i + 1, [1, 2, 3, 4, 5, 6], 7)
    )
    const counts = makeCounts()
    const result = recommendStats(games, counts)
    expect(result).toHaveLength(6)
    expect(new Set(result).size).toBe(6)
    result.forEach(n => expect(n).toBeGreaterThanOrEqual(1))
    result.forEach(n => expect(n).toBeLessThanOrEqual(45))
    // verify sorted ascending
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i]).toBeLessThan(result[i + 1])
    }
  })
})

describe('recommendException', () => {
  it('returns 6 unique numbers not including top 2 most frequent or last 2 bonus balls', () => {
    const games = Array.from({ length: 10 }, (_, i) =>
      makeGame(i + 1, [1, 2, 3, 4, 5, 6], 7 + i)
    )
    const counts = makeCounts() // number 1 is most frequent, number 2 is second
    const result = recommendException(games, counts)
    expect(result).toHaveLength(6)
    expect(new Set(result).size).toBe(6)
    // Top 2 most frequent (1 and 2) should be excluded
    expect(result).not.toContain(1)
    expect(result).not.toContain(2)
    // Last 2 bonus balls (7, 8) should be excluded
    expect(result).not.toContain(7)
    expect(result).not.toContain(8)
    // verify sorted ascending
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i]).toBeLessThan(result[i + 1])
    }
  })
})
