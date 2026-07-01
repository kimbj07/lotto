import type { GameInfo, AppearanceCount } from '@/types/lotto'

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

export function recommendRandom(): number[] {
  return shuffle(ALL_NUMBERS).slice(0, 6).sort((a, b) => a - b)
}

export function recommendWithExclusions(exclude: number[]): number[] {
  const candidates = ALL_NUMBERS.filter(n => !exclude.includes(n))
  if (candidates.length < 6) {
    throw new Error('Too many numbers excluded — fewer than 6 candidates remain')
  }
  return shuffle(candidates).slice(0, 6).sort((a, b) => a - b)
}

export function recommendStats(games: GameInfo[], counts: AppearanceCount[]): number[] {
  // counts must be sorted DESC by win_count (most frequent first)
  const available = new Set(ALL_NUMBERS)

  // Exclude top MAX_APPEARANCE_LIMIT most frequent numbers
  counts.slice(0, MAX_APPEARANCE_LIMIT).forEach(c => available.delete(c.number))

  // Exclude last LATEST_BONUS_LIMIT bonus balls
  games.slice(0, LATEST_BONUS_LIMIT).forEach(g => available.delete(g.bonus_ball))

  const selected: number[] = []

  // Pick 1 from the bottom LOWEST_PICK_POOL least-frequent numbers
  const bottom = counts.slice(-LOWEST_PICK_POOL).map(c => c.number).filter(n => available.has(n))
  if (bottom.length > 0) {
    const pick = pickRandom(bottom)
    selected.push(pick)
    available.delete(pick)
  }

  // Pick 1 from around rank MID_PICK_INDEX (0-based index 8)
  const midIndex = Math.min(MID_PICK_INDEX - 1, counts.length - 1)
  const midCandidate = counts[midIndex]
  if (midCandidate && available.has(midCandidate.number)) {
    selected.push(midCandidate.number)
    available.delete(midCandidate.number)
  }

  // Fill remaining slots randomly
  const remaining = Array.from(available)
  const needed = 6 - selected.length
  const extras = shuffle(remaining).slice(0, needed)
  selected.push(...extras)

  if (selected.length !== 6) {
    throw new Error('Failed to select 6 numbers')
  }

  return selected.sort((a, b) => a - b)
}

export function recommendException(games: GameInfo[], counts: AppearanceCount[]): number[] {
  const available = new Set(ALL_NUMBERS)

  // Exclude top MAX_APPEARANCE_LIMIT most frequent numbers
  counts.slice(0, MAX_APPEARANCE_LIMIT).forEach(c => available.delete(c.number))

  // Exclude last LATEST_BONUS_LIMIT bonus balls
  games.slice(0, LATEST_BONUS_LIMIT).forEach(g => available.delete(g.bonus_ball))

  const selected: number[] = []

  // Pick 1 from the bottom LOWEST_PICK_POOL
  const bottom = counts.slice(-LOWEST_PICK_POOL).map(c => c.number).filter(n => available.has(n))
  if (bottom.length > 0) {
    const pick = pickRandom(bottom)
    selected.push(pick)
    available.delete(pick)
  }

  // Pick 1 from rank MID_PICK_INDEX
  const midIndex = Math.min(MID_PICK_INDEX - 1, counts.length - 1)
  const midCandidate = counts[midIndex]
  if (midCandidate && available.has(midCandidate.number)) {
    selected.push(midCandidate.number)
    available.delete(midCandidate.number)
  }

  // Pick 1 from the game N_WEEKS_AGO draws ago
  if (games.length >= N_WEEKS_AGO) {
    const nWeeksGame = games[N_WEEKS_AGO - 1]
    const nWeeksNumbers = [
      nWeeksGame.first_ball, nWeeksGame.second_ball, nWeeksGame.third_ball,
      nWeeksGame.fourth_ball, nWeeksGame.fifth_ball, nWeeksGame.sixth_ball,
    ].filter(n => available.has(n))
    if (nWeeksNumbers.length > 0) {
      const pick = pickRandom(nWeeksNumbers)
      selected.push(pick)
      available.delete(pick)
    }
  }

  // Fill remaining slots randomly
  const remaining = shuffle(Array.from(available))
  const needed = 6 - selected.length
  selected.push(...remaining.slice(0, needed))

  if (selected.length !== 6) {
    throw new Error('Failed to select 6 numbers')
  }

  return selected.sort((a, b) => a - b)
}
