import { analyzePatterns, BASE_RATE, CHI2_CUTOFF_95, Z_THRESHOLD, type DrawBalls } from '../patterns'

// Deterministic PRNG so the "uniform random" fixture is reproducible.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function uniformDraws(n: number, seed = 1): DrawBalls[] {
  const rnd = mulberry32(seed)
  return Array.from({ length: n }, (_, i) => {
    const pool = Array.from({ length: 45 }, (_, k) => k + 1)
    for (let j = pool.length - 1; j > 0; j--) {
      const r = Math.floor(rnd() * (j + 1)); [pool[j], pool[r]] = [pool[r], pool[j]]
    }
    return { game_no: i + 1, balls: pool.slice(0, 6).sort((a, b) => a - b), bonus: pool[6] }
  })
}

describe('analyzePatterns', () => {
  it('reports the five hypotheses with the 6/45 base rate and no pattern on uniform draws', () => {
    const r = analyzePatterns(uniformDraws(3000))
    expect(r.draws).toBe(3000)
    expect(r.fromGameNo).toBe(1)
    expect(r.toGameNo).toBe(3000)
    expect(r.baseRate).toBeCloseTo(6 / 45)
    expect(r.tests.map(t => t.key)).toEqual([
      'prev_bonus_repeat', 'prev_main_repeat', 'cumulative_hot', 'cumulative_cold', 'recent_hot',
    ])
    for (const t of r.tests) {
      expect(t.expected).toBeCloseTo(BASE_RATE)
      expect(t.trials).toBeGreaterThan(0)
      expect(t.observed).toBeCloseTo(t.hits / t.trials)
      // 3000 uniform draws: a |z| ≥ 4 has p ≈ 6e-5 per test — a fixed seed makes this deterministic anyway.
      expect(Math.abs(t.z)).toBeLessThan(4)
    }
    expect(r.uniformity.df).toBe(44)
    expect(r.uniformity.uniform).toBe(true)
    expect(r.uniformity.cutoff95).toBe(CHI2_CUTOFF_95)
    expect(CHI2_CUTOFF_95).toBeCloseTo(53.6, 1) // 60.48 × 39/44: without-replacement correction
    expect(r.zThreshold).toBe(Z_THRESHOLD)
    expect(r.persistence).toBe('none')
    expect(Math.abs(r.splitHalfZ)).toBeLessThan(4)
    expect(r.mostFrequent).toHaveLength(5)
    expect(r.leastFrequent).toHaveLength(5)
    expect(r.mostFrequent[0].count).toBeGreaterThanOrEqual(r.leastFrequent[0].count)
    expect(Math.abs(r.splitHalfR)).toBeLessThan(0.6)
  })

  it('uses the hypergeometric variance: K checks per draw shrink the SE by √((45−K)/44)', () => {
    // Build a history where exactly `hits` of the trials succeed and compare
    // the reported z with the closed form. Use the bonus test (K=1, factor 1)
    // and the main-repeat test (K=6, factor 39/44) on the same draws.
    const draws = uniformDraws(400, 11)
    const r = analyzePatterns(draws)
    const t = Object.fromEntries(r.tests.map(x => [x.key, x]))
    const closedForm = (hits: number, trials: number, k: number) =>
      (hits - trials * BASE_RATE) / Math.sqrt(trials * BASE_RATE * (1 - BASE_RATE) * (45 - k) / 44)
    expect(t.prev_bonus_repeat.z).toBeCloseTo(closedForm(t.prev_bonus_repeat.hits, t.prev_bonus_repeat.trials, 1), 2)
    expect(t.prev_main_repeat.z).toBeCloseTo(closedForm(t.prev_main_repeat.hits, t.prev_main_repeat.trials, 6), 2)
    expect(t.recent_hot.z).toBeCloseTo(closedForm(t.recent_hot.hits, t.recent_hot.trials, 10), 2)
  })

  it('trial counts follow the definitions', () => {
    const r = analyzePatterns(uniformDraws(300))
    const t = Object.fromEntries(r.tests.map(x => [x.key, x]))
    expect(t.prev_bonus_repeat.trials).toBe(299)          // one per draw after the first
    expect(t.prev_main_repeat.trials).toBe(299 * 6)       // six per draw after the first
    expect(t.cumulative_hot.trials).toBe((300 - 100) * 5) // top-5 after a 100-draw warm-up
    expect(t.cumulative_cold.trials).toBe((300 - 100) * 5)
    expect(t.recent_hot.trials).toBe((300 - 20) * 10)     // top-10 after a 20-draw window
  })

  it('detects a rigged history where last round\'s bonus always comes back', () => {
    const draws = uniformDraws(600, 7)
    for (let i = 1; i < draws.length; i++) {
      const prevBonus = draws[i - 1].bonus
      if (!draws[i].balls.includes(prevBonus)) {
        // this draw's bonus must not collide with the ball we're about to place
        if (draws[i].bonus === prevBonus) draws[i].bonus = draws[i].balls[0]
        draws[i].balls[0] = prevBonus
      }
    }
    const t = analyzePatterns(draws).tests.find(x => x.key === 'prev_bonus_repeat')!
    expect(t.observed).toBeCloseTo(1)
    expect(t.verdict).toBe('more')
    expect(t.z).toBeGreaterThan(10)
  })

  it('pairs "previous round" by game_no, so a gap in the history is not treated as adjacent', () => {
    const draws = uniformDraws(300, 5)
    // remove draws 101..150: 249 remain, only 248 adjacent pairs... minus the one across the gap
    const gapped = draws.filter(d => d.game_no <= 100 || d.game_no > 150)
    const t = Object.fromEntries(analyzePatterns(gapped).tests.map(x => [x.key, x]))
    expect(gapped).toHaveLength(250)
    expect(t.prev_bonus_repeat.trials).toBe(248) // 249 positions minus the 100→151 jump
    expect(t.prev_main_repeat.trials).toBe(248 * 6)
  })

  it('recent-hot / cumulative-hot hit counts match a brute-force reference exactly', () => {
    // Strong oracle: recompute every window and every cumulative ranking the
    // slow, obvious way and demand the SAME hit count. Any bookkeeping slip
    // (never evicting the oldest draw, evicting the wrong one, ranking with
    // the current draw already counted) changes at least one window's top-K
    // and therefore the total. Mutation-checked: both the "no eviction" and
    // the "i − 20 + 1" mutants fail this test.
    const draws = uniformDraws(400, 21)
    const top = (from: number, to: number, k: number) => {
      const c = new Array<number>(46).fill(0)
      for (let j = from; j < to; j++) for (const b of draws[j].balls) c[b]++
      return Array.from({ length: 45 }, (_, i) => i + 1).sort((a, b) => c[b] - c[a] || a - b).slice(0, k)
    }
    const bottom = (to: number, k: number) => {
      const c = new Array<number>(46).fill(0)
      for (let j = 0; j < to; j++) for (const b of draws[j].balls) c[b]++
      return Array.from({ length: 45 }, (_, i) => i + 1).sort((a, b) => c[b] - c[a] || a - b).slice(-k)
    }
    let recent = 0, hot = 0, cold = 0
    for (let i = 0; i < draws.length; i++) {
      const cur = new Set(draws[i].balls)
      if (i >= 20) recent += top(i - 20, i, 10).filter(x => cur.has(x)).length
      if (i >= 100) {
        hot += top(0, i, 5).filter(x => cur.has(x)).length
        cold += bottom(i, 5).filter(x => cur.has(x)).length
      }
    }
    const t = Object.fromEntries(analyzePatterns(draws).tests.map(x => [x.key, x]))
    expect(t.recent_hot.hits).toBe(recent)
    expect(t.cumulative_hot.hits).toBe(hot)
    expect(t.cumulative_cold.hits).toBe(cold)
  })

  it('flags a non-uniform history', () => {
    // every draw is 1..6 → chi-square explodes
    const draws: DrawBalls[] = Array.from({ length: 200 }, (_, i) => ({ game_no: i + 1, balls: [1, 2, 3, 4, 5, 6], bonus: 7 }))
    const r = analyzePatterns(draws)
    expect(r.uniformity.uniform).toBe(false)
    expect(r.mostFrequent.map(f => f.number)).toEqual([1, 2, 3, 4, 5, 6].slice(0, 5))
    // and "hot numbers keep hitting" shows up as a positive verdict
    expect(r.tests.find(x => x.key === 'cumulative_hot')!.verdict).toBe('more')
  })

  it('is order-independent and survives an empty or tiny history', () => {
    const draws = uniformDraws(150, 3)
    const shuffled = [...draws].reverse()
    expect(analyzePatterns(shuffled)).toEqual(analyzePatterns(draws))

    const empty = analyzePatterns([])
    expect(empty.draws).toBe(0)
    expect(empty.tests.every(t => t.trials === 0 && t.z === 0 && t.verdict === 'none')).toBe(true)
    expect(Number.isFinite(empty.uniformity.chi2)).toBe(true)
    expect(empty.splitHalfZ).toBe(0)
    expect(empty.persistence).toBe('none')

    const one = analyzePatterns(uniformDraws(1))
    expect(one.tests.every(t => t.trials === 0)).toBe(true)
  })
})
