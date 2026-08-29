import type { GameInfo, AppearanceCount } from '@/types/lotto'
import { TARGET5_GAMES, TARGET5_MAX_EXCLUDE } from '@/lib/recommendModes'

const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1)

const MAX_APPEARANCE_LIMIT = 2   // exclude top N most frequent numbers
const LATEST_BONUS_LIMIT = 2     // exclude last N bonus balls
const LOWEST_PICK_POOL = 9       // pick 1 from the bottom N by frequency
const MID_PICK_INDEX = 9         // pick 1 from rank [8..8] (0-indexed) by frequency
const N_WEEKS_AGO = 8            // for exception mode: pick from the game 8 draws ago

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export interface RecommendConstraints { include?: number[]; exclude?: number[] }

function fillRandom(selected: number[], pool: number[]): void {
  const need = 6 - selected.length
  if (need > 0) selected.push(...shuffle(pool).slice(0, need))
}

// Guarantee exactly 6: if the mode's soft-exclusions left us short, fall back to
// any allowed number (not excluded, not already selected).
function finalize(selected: number[], exclude: number[]): number[] {
  if (selected.length < 6) {
    const allowed = ALL_NUMBERS.filter(n => !exclude.includes(n) && !selected.includes(n))
    fillRandom(selected, allowed)
  }
  if (selected.length !== 6) throw new Error('Failed to select 6 numbers')
  return selected.slice(0, 6).sort((a, b) => a - b)
}

export function recommendRandom(c: RecommendConstraints = {}): number[] {
  const include = c.include ?? []
  const exclude = c.exclude ?? []
  const selected = [...include]
  const pool = ALL_NUMBERS.filter(n => !exclude.includes(n) && !include.includes(n))
  fillRandom(selected, pool)
  return finalize(selected, exclude)
}

export function recommendStats(
  games: GameInfo[], counts: AppearanceCount[], c: RecommendConstraints = {}
): number[] {
  const include = c.include ?? []
  const exclude = c.exclude ?? []
  const available = new Set(ALL_NUMBERS.filter(n => !exclude.includes(n)))
  const selected: number[] = []
  for (const n of include) { selected.push(n); available.delete(n) }

  counts.slice(0, MAX_APPEARANCE_LIMIT).forEach(cc => available.delete(cc.number))
  games.slice(0, LATEST_BONUS_LIMIT).forEach(g => available.delete(g.bonus_ball))

  if (selected.length < 6) {
    const bottom = counts.slice(-LOWEST_PICK_POOL).map(cc => cc.number).filter(n => available.has(n))
    if (bottom.length > 0) { const pick = pickRandom(bottom); selected.push(pick); available.delete(pick) }
  }
  if (selected.length < 6) {
    const midIndex = Math.min(MID_PICK_INDEX - 1, counts.length - 1)
    const midCandidate = counts[midIndex]
    if (midCandidate && available.has(midCandidate.number)) { selected.push(midCandidate.number); available.delete(midCandidate.number) }
  }
  fillRandom(selected, Array.from(available))
  return finalize(selected, exclude)
}

export function recommendException(
  games: GameInfo[], counts: AppearanceCount[], c: RecommendConstraints = {}
): number[] {
  const include = c.include ?? []
  const exclude = c.exclude ?? []
  const available = new Set(ALL_NUMBERS.filter(n => !exclude.includes(n)))
  const selected: number[] = []
  for (const n of include) { selected.push(n); available.delete(n) }

  counts.slice(0, MAX_APPEARANCE_LIMIT).forEach(cc => available.delete(cc.number))
  games.slice(0, LATEST_BONUS_LIMIT).forEach(g => available.delete(g.bonus_ball))

  if (selected.length < 6) {
    const bottom = counts.slice(-LOWEST_PICK_POOL).map(cc => cc.number).filter(n => available.has(n))
    if (bottom.length > 0) { const pick = pickRandom(bottom); selected.push(pick); available.delete(pick) }
  }
  if (selected.length < 6) {
    const midIndex = Math.min(MID_PICK_INDEX - 1, counts.length - 1)
    const midCandidate = counts[midIndex]
    if (midCandidate && available.has(midCandidate.number)) { selected.push(midCandidate.number); available.delete(midCandidate.number) }
  }
  if (selected.length < 6 && games.length >= N_WEEKS_AGO) {
    const nWeeksGame = games[N_WEEKS_AGO - 1]
    const nWeeksNumbers = [
      nWeeksGame.first_ball, nWeeksGame.second_ball, nWeeksGame.third_ball,
      nWeeksGame.fourth_ball, nWeeksGame.fifth_ball, nWeeksGame.sixth_ball,
    ].filter(n => available.has(n))
    if (nWeeksNumbers.length > 0) { const pick = pickRandom(nWeeksNumbers); selected.push(pick); available.delete(pick) }
  }
  fillRandom(selected, Array.from(available))
  return finalize(selected, exclude)
}

// "5등 노리기" — one 5-game slip (5,000원) laid out to maximise the chance that
// AT LEAST ONE game matches 3+ numbers (5th prize, 5,000원).
//
// Why it works (exact enumeration over all C(45,6) = 8,145,060 draws):
//   1 game                          P(≥1 game ranks) =  2.38%
//   5 independent random games                        11.36%  (= 1 − (1 − 0.0238)^5)
//   5 games sharing 3 numbers                          9.24%
//   5 games with 30 DISTINCT numbers                  11.87%  ← this mode
// The expected number of winning games is identical (0.119) for every layout —
// a lotto draw is uniform, so no choice of numbers moves it. What the layout
// DOES change is how much the games' win events overlap: disjoint games overlap
// the least, so the union ("at least one hits") is the largest. 11.87% is the
// maximum for 5 games. The 30 numbers themselves are drawn uniformly at random.
//
// Constraints: `include` numbers are spread round-robin across the games (so
// they never collide); `exclude` may hold at most 15 numbers (30 must remain).
export function recommendTarget5(c: RecommendConstraints = {}): number[][] {
  const include = c.include ?? []
  const exclude = c.exclude ?? []
  if (exclude.length > TARGET5_MAX_EXCLUDE) {
    throw new Error(`5등 노리기는 제외 번호를 최대 ${TARGET5_MAX_EXCLUDE}개까지 고를 수 있어요`)
  }
  const games: number[][] = Array.from({ length: TARGET5_GAMES }, () => [])
  include.forEach((n, i) => games[i % TARGET5_GAMES].push(n))

  const pool = shuffle(ALL_NUMBERS.filter(n => !exclude.includes(n) && !include.includes(n)))
  for (const game of games) {
    while (game.length < 6) {
      const n = pool.pop()
      if (n === undefined) throw new Error('Failed to build a 5-game slip')
      game.push(n)
    }
  }
  return games.map(g => g.sort((a, b) => a - b))
}
