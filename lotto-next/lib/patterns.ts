import type { PatternReport, PatternTest } from '@/types/lotto'

// "패턴 검증" — tests the folk hypotheses lotto players hold (last week's
// bonus won't come back, hot numbers cool down, …) against the real draw
// history, and reports them honestly. Everything here is pure; the API route
// feeds it every draw and caches the result until the weekly cron evicts it.
//
// Base rate: any specific number is one of the 6 drawn with p = 6/45 ≈ 13.33%.
// A hypothesis "has a pattern" only if its observed hit rate departs from
// that by more than sampling noise — we report a z-score.
//
// Statistics notes (methodology review, 2026-08-29):
// - Within one draw the K numbers we check are drawn WITHOUT replacement, so
//   the K trials are negatively correlated (hypergeometric, not iid Bernoulli)
//   and the true variance is (45 − K)/44 of the naive binomial one. Using the
//   naive SE understates |z| by 5–12%; the correction below fixes that.
// - The page shows ~7 statistics at once (5 hypotheses + χ² + r), so at a
//   naive 2σ cutoff something would "light up" by chance ~25% of weeks. We
//   use 2.5σ (two-sided p ≈ 0.012 each, ≈ 8% family-wise) everywhere.

export interface DrawBalls {
  game_no: number
  balls: number[]   // the 6 main numbers
  bonus: number
}

export const BASE_RATE = 6 / 45
export const Z_THRESHOLD = 2.5
// Rolling window for the "recently hot" hypothesis and the top-K sizes.
export const RECENT_WINDOW = 20
export const HOT_K = 5
export const RECENT_HOT_K = 10
// Cumulative hot/cold tests need some history before ranking means anything.
const WARMUP_DRAWS = 100
// Chi-square 95% critical value for df = 44 (45 numbers − 1) assumes counts
// from WITH-replacement sampling. Each draw takes 6 of 45 without
// replacement, which scales the statistic by (45 − 6)/44, so the true 95th
// percentile is 60.48 × 39/44 ≈ 53.6 (confirmed by Monte Carlo).
export const CHI2_CUTOFF_95 = Number((60.48 * (45 - 6) / 44).toFixed(1))

// Finite-population correction for K checks per draw (see notes above).
function hypergeometricFactor(perDraw: number): number {
  return (45 - perDraw) / 44
}

function zScore(hits: number, trials: number, perDraw: number): number {
  if (trials === 0) return 0
  const variance = trials * BASE_RATE * (1 - BASE_RATE) * hypergeometricFactor(perDraw)
  return (hits - trials * BASE_RATE) / Math.sqrt(variance)
}

function verdictOf(z: number): PatternTest['verdict'] {
  return Math.abs(z) < Z_THRESHOLD ? 'none' : z > 0 ? 'more' : 'less'
}

function makeTest(key: string, hits: number, trials: number, perDraw: number): PatternTest {
  const z = zScore(hits, trials, perDraw)
  return {
    key,
    hits,
    trials,
    observed: trials ? hits / trials : 0,
    expected: BASE_RATE,
    z: Number(z.toFixed(2)),
    verdict: verdictOf(z),
  }
}

function rankByCount(counts: number[]): number[] {
  // numbers 1..45 sorted by count desc; ties broken by number asc so the
  // ranking is deterministic.
  return Array.from({ length: 45 }, (_, i) => i + 1)
    .sort((a, b) => counts[b] - counts[a] || a - b)
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my)
    sxx += (xs[i] - mx) ** 2
    syy += (ys[i] - my) ** 2
  }
  return sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy)
}

export function analyzePatterns(input: DrawBalls[]): PatternReport {
  const draws = [...input].sort((a, b) => a.game_no - b.game_no)
  const n = draws.length

  // [1] previous round's bonus appears among next round's 6
  let bonusHits = 0, bonusTrials = 0
  // [2] previous round's 6 main numbers reappear
  let mainHits = 0, mainTrials = 0
  for (let i = 1; i < n; i++) {
    // "Previous round" means game_no − 1, not the previous array element:
    // a gap in the history must not pair non-adjacent draws.
    if (draws[i].game_no !== draws[i - 1].game_no + 1) continue
    const cur = new Set(draws[i].balls)
    bonusTrials++
    if (cur.has(draws[i - 1].bonus)) bonusHits++
    for (const b of draws[i - 1].balls) { mainTrials++; if (cur.has(b)) mainHits++ }
  }

  // [3] cumulative hot top-K / cold bottom-K (ranked on history BEFORE the draw)
  const cum = new Array<number>(46).fill(0)
  let hotHits = 0, hotTrials = 0, coldHits = 0, coldTrials = 0
  for (let i = 0; i < n; i++) {
    if (i >= WARMUP_DRAWS) {
      const order = rankByCount(cum)
      const hot = order.slice(0, HOT_K)
      const cold = order.slice(-HOT_K)
      const cur = new Set(draws[i].balls)
      for (const x of hot) { hotTrials++; if (cur.has(x)) hotHits++ }
      for (const x of cold) { coldTrials++; if (cur.has(x)) coldHits++ }
    }
    for (const b of draws[i].balls) cum[b]++
  }

  // [4] recently hot: top-10 of the last 20 draws
  let recentHits = 0, recentTrials = 0
  const win = new Array<number>(46).fill(0)
  for (let i = 0; i < n; i++) {
    if (i >= RECENT_WINDOW) {
      const hot = rankByCount(win).slice(0, RECENT_HOT_K)
      const cur = new Set(draws[i].balls)
      for (const x of hot) { recentTrials++; if (cur.has(x)) recentHits++ }
      for (const b of draws[i - RECENT_WINDOW].balls) win[b]--
    }
    for (const b of draws[i].balls) win[b]++
  }

  // [5] all-time uniformity (chi-square, df = 44)
  const expectedPerNumber = (n * 6) / 45
  let chi2 = 0
  if (n > 0) for (let x = 1; x <= 45; x++) chi2 += (cum[x] - expectedPerNumber) ** 2 / expectedPerNumber
  const ranked = rankByCount(cum)
  const freq = (x: number) => ({ number: x, count: cum[x] })

  // [6] split-half persistence of per-number frequency. Under independence r
  // has mean 0 and sd ≈ 1/√(45 − 2) ≈ 0.15 (Monte-Carlo confirmed), so it
  // is judged on the same z scale as the hypotheses — a fixed |r| cutoff
  // would either never fire or fire on noise.
  const half = Math.floor(n / 2)
  const c1 = new Array<number>(46).fill(0), c2 = new Array<number>(46).fill(0)
  draws.slice(0, half).forEach(d => d.balls.forEach(b => c1[b]++))
  draws.slice(half).forEach(d => d.balls.forEach(b => c2[b]++))
  const splitHalfR = n >= 2 ? pearson(c1.slice(1), c2.slice(1)) : 0
  const splitHalfZ = splitHalfR * Math.sqrt(45 - 2)

  return {
    draws: n,
    fromGameNo: n ? draws[0].game_no : 0,
    toGameNo: n ? draws[n - 1].game_no : 0,
    baseRate: BASE_RATE,
    zThreshold: Z_THRESHOLD,
    tests: [
      makeTest('prev_bonus_repeat', bonusHits, bonusTrials, 1),
      makeTest('prev_main_repeat', mainHits, mainTrials, 6),
      makeTest('cumulative_hot', hotHits, hotTrials, HOT_K),
      makeTest('cumulative_cold', coldHits, coldTrials, HOT_K),
      makeTest('recent_hot', recentHits, recentTrials, RECENT_HOT_K),
    ],
    uniformity: {
      chi2: Number(chi2.toFixed(1)),
      df: 44,
      cutoff95: CHI2_CUTOFF_95,
      expectedPerNumber: Number(expectedPerNumber.toFixed(1)),
      // Each number's count is Binomial(n, 6/45): sd = √(n·p·(1−p)) = √(E·(1−p)).
      sd: Number(Math.sqrt(expectedPerNumber * (1 - BASE_RATE)).toFixed(1)),
      uniform: n > 0 && chi2 < CHI2_CUTOFF_95,
    },
    mostFrequent: ranked.slice(0, 5).map(freq),
    leastFrequent: ranked.slice(-5).reverse().map(freq),
    splitHalfR: Number(splitHalfR.toFixed(3)),
    splitHalfZ: Number(splitHalfZ.toFixed(2)),
    persistence: verdictOf(splitHalfZ),
  }
}
