# 번호 포함/제외 추천 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users optionally force-include (max 5) and exclude (max 38) numbers on the 번호 추천 page — layered as constraints on the chosen mode — and show a description of each mode.

**Architecture:** `lib/recommend.ts` generators gain an optional `{ include, exclude }` constraint; the recommend API validates and forwards it; a new selectable 1–45 grid component powers two pickers in `RecommenderClient`, which also shows mode descriptions.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Jest + Testing Library, Tailwind (OMC design system).

## Global Constraints

- **Build on top of merged PR #7** (번추 결과): `app/api/recommend/route.ts` already contains `recordRecommendation(...)` and its test file already exists. Branch off master AFTER PR #7 is merged.
- Next.js 14 App Router (RSC + 'use client' split); TypeScript strict; types snake_case.
- Korean UI copy; OMC design system (`.card`, `.btn-gold`, brand/gold tokens, `font-display`, small `LottoBall`s).
- Generators always return exactly 6 unique numbers in 1–45, sorted ascending.
- **Include:** 0–5, each 1–45, unique. **Exclude:** 0–38, each 1–45, unique. Include/exclude disjoint. API returns **400** on violation.
- Spec: `docs/superpowers/specs/2026-07-01-include-exclude-picker-design.md`.
- Route tests importing `next/server` handlers use `/** @jest-environment node */`.

---

### Task 1: Constraint-aware generators in `lib/recommend.ts`

**Files:**
- Modify: `lib/recommend.ts`
- Test: `lib/__tests__/recommend.test.ts`

**Interfaces:**
- Produces:
  - `export interface RecommendConstraints { include?: number[]; exclude?: number[] }`
  - `recommendRandom(c?: RecommendConstraints): number[]`
  - `recommendStats(games: GameInfo[], counts: AppearanceCount[], c?: RecommendConstraints): number[]`
  - `recommendException(games: GameInfo[], counts: AppearanceCount[], c?: RecommendConstraints): number[]`
- Removes: `recommendWithExclusions` (subsumed by the constrained generators).

- [ ] **Step 1: Write the failing tests** — replace the `recommendWithExclusions` tests in `lib/__tests__/recommend.test.ts` with constraint tests (keep any existing no-constraint tests for stats/exception/random):

```ts
import { recommendRandom, recommendStats, recommendException } from '../recommend'
import type { GameInfo, AppearanceCount } from '@/types/lotto'

// minimal stats fixtures
const counts: AppearanceCount[] = Array.from({ length: 45 }, (_, i) => ({
  number: i + 1, win_count: 45 - i, bonus_count: 0, sum_count: 45 - i,
}))
const games = [] as unknown as GameInfo[]

function assertValid(nums: number[]) {
  expect(nums).toHaveLength(6)
  expect(new Set(nums).size).toBe(6)
  nums.forEach(n => { expect(n).toBeGreaterThanOrEqual(1); expect(n).toBeLessThanOrEqual(45) })
  expect([...nums]).toEqual([...nums].sort((a, b) => a - b))
}

describe('constraints', () => {
  const cases: [string, (c: any) => number[]][] = [
    ['random', (c) => recommendRandom(c)],
    ['stats', (c) => recommendStats(games, counts, c)],
    ['exception', (c) => recommendException(games, counts, c)],
  ]
  for (const [name, gen] of cases) {
    it(`${name}: includes always present, excludes never present`, () => {
      for (let i = 0; i < 30; i++) {
        const nums = gen({ include: [7, 13], exclude: [1, 2, 3, 4, 5] })
        assertValid(nums)
        expect(nums).toEqual(expect.arrayContaining([7, 13]))
        expect(nums.some(n => [1, 2, 3, 4, 5].includes(n))).toBe(false)
      }
    })

    it(`${name}: max-stress (5 includes + 38 excludes) still returns 6`, () => {
      const include = [10, 11, 12, 13, 14]
      const exclude = Array.from({ length: 38 }, (_, i) => i + 1).filter(n => !include.includes(n)).slice(0, 38)
      const nums = gen({ include, exclude })
      assertValid(nums)
      expect(nums).toEqual(expect.arrayContaining(include))
      expect(nums.some(n => exclude.includes(n))).toBe(false)
    })

    it(`${name}: no constraints returns a valid set`, () => {
      assertValid(gen({}))
    })
  }
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest lib/__tests__/recommend.test.ts`
Expected: FAIL — generators don't accept a constraints arg / `recommendWithExclusions` removed.

- [ ] **Step 3: Implement the constraint logic in `lib/recommend.ts`**

Add the interface + two helpers near the top (after `pickRandom`):

```ts
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
```

Replace `recommendRandom` and delete `recommendWithExclusions`:

```ts
export function recommendRandom(c: RecommendConstraints = {}): number[] {
  const include = c.include ?? []
  const exclude = c.exclude ?? []
  const selected = [...include]
  const pool = ALL_NUMBERS.filter(n => !exclude.includes(n) && !include.includes(n))
  fillRandom(selected, pool)
  return finalize(selected, exclude)
}
```

Rewrite `recommendStats` to thread constraints:

```ts
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
```

Rewrite `recommendException` the same way, keeping its extra pick guarded:

```ts
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
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest lib/__tests__/recommend.test.ts` then `npx jest` (full suite).
Expected: PASS. Note: `app/api/recommend/route.ts` still imports `recommendWithExclusions` at this point and will fail typecheck — that import is removed in Task 2. If you run `npm run build` now it will fail on that import; that is expected and fixed by Task 2. (Jest tests do not import the route's removed symbol.)

- [ ] **Step 5: Commit**

```bash
git add lib/recommend.ts lib/__tests__/recommend.test.ts
git commit -m "feat: constraint-aware recommenders (include/exclude)"
```

---

### Task 2: `include`/`exclude` params + validation in the recommend route

**Files:**
- Modify: `app/api/recommend/route.ts`
- Test: `app/api/recommend/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `recommendRandom/Stats/Exception(..., { include, exclude })` from Task 1.
- Produces: `GET /api/recommend?mode=&include=&exclude=` — validated, constraints forwarded to the generator; recording (from PR #7) unchanged, storing the actual mode.

- [ ] **Step 1: Update the tests** — in `app/api/recommend/__tests__/route.test.ts`:
  - Remove the PR-#7 test that asserted `mode === 'custom'` for the exclusions path (that mode no longer exists).
  - Keep the "records a random recommendation" and "still returns numbers when recording fails" tests.
  - Add these (the random path needs no `createServerClient` stats mock; it uses only the admin mock already in the file):

```ts
it('applies include/exclude constraints on the random path', async () => {
  const res = await GET(makeReq('mode=random&include=7&exclude=1,2,3,4,5'))
  const body = await res.json()
  expect(res.status).toBe(200)
  expect(body.numbers).toContain(7)
  expect(body.numbers.some((n: number) => [1, 2, 3, 4, 5].includes(n))).toBe(false)
})

it('rejects too many include numbers', async () => {
  const res = await GET(makeReq('mode=random&include=1,2,3,4,5,6'))
  expect(res.status).toBe(400)
})

it('rejects too many exclude numbers', async () => {
  const exclude = Array.from({ length: 39 }, (_, i) => i + 1).join(',')
  const res = await GET(makeReq(`mode=random&exclude=${exclude}`))
  expect(res.status).toBe(400)
})

it('rejects include/exclude overlap', async () => {
  const res = await GET(makeReq('mode=random&include=7&exclude=7'))
  expect(res.status).toBe(400)
})

it('rejects out-of-range numbers', async () => {
  const res = await GET(makeReq('mode=random&include=46'))
  expect(res.status).toBe(400)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest app/api/recommend`
Expected: FAIL — no `include` handling / validation yet (and the removed custom test is gone).

- [ ] **Step 3: Implement in `app/api/recommend/route.ts`**

Update the import to drop `recommendWithExclusions`:
```ts
import {
  recommendStats,
  recommendException,
  recommendRandom,
} from '@/lib/recommend'
```

Replace the top of `GET` (param parsing + the old exclusions bypass) with parsing + validation:

```ts
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode = searchParams.get('mode') ?? 'stats'

  if (!['stats', 'exception', 'random'].includes(mode)) {
    return NextResponse.json({ error: 'mode must be stats, exception, or random' }, { status: 400 })
  }

  const parseNums = (p: string | null): number[] =>
    p ? p.split(',').map(s => parseInt(s, 10)) : []
  const include = parseNums(searchParams.get('include'))
  const exclude = parseNums(searchParams.get('exclude'))

  const badSet = (nums: number[], max: number, name: string): string | null => {
    if (nums.some(n => isNaN(n) || n < 1 || n > 45)) return `${name} numbers must be between 1 and 45`
    if (new Set(nums).size !== nums.length) return `${name} numbers must be unique`
    if (nums.length > max) return `at most ${max} ${name} numbers allowed`
    return null
  }
  const incErr = badSet(include, 5, 'include')
  if (incErr) return NextResponse.json({ error: incErr }, { status: 400 })
  const excErr = badSet(exclude, 38, 'exclude')
  if (excErr) return NextResponse.json({ error: excErr }, { status: 400 })
  if (include.some(n => exclude.includes(n))) {
    return NextResponse.json({ error: 'include and exclude must be disjoint' }, { status: 400 })
  }

  const constraints = { include, exclude }

  if (mode === 'random') {
    const numbers = recommendRandom(constraints)
    await recordRecommendation(numbers, 'random')
    return NextResponse.json({ numbers })
  }

  const supabase = createServerClient()
  // ...existing latest-game_no fetch + get_game_info_in_range + get_appearance_count...
```

At the bottom stats/exception block, pass constraints and keep recording:

```ts
  try {
    const numbers = mode === 'exception'
      ? recommendException(games, counts, constraints)
      : recommendStats(games, counts, constraints)
    await recordRecommendation(numbers, mode, latestNo + 1)
    return NextResponse.json({ numbers })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
```

(The old `if (excludeParam) { ... recommendWithExclusions ... }` branch is deleted entirely. `recordRecommendation` keeps its Task-3/PR-#7 signature `(numbers, mode, targetGameNo?)`.)

- [ ] **Step 4: Run tests + typecheck**

Run: `npx jest app/api/recommend`, then `npx jest`, then `npm run build`.
Expected: all pass; build is now clean (the dangling `recommendWithExclusions` import from Task 1 is gone).

- [ ] **Step 5: Commit**

```bash
git add app/api/recommend/route.ts app/api/recommend/__tests__/route.test.ts
git commit -m "feat: validate + forward include/exclude constraints in recommend route"
```

---

### Task 3: `SelectableNumberGrid` component

**Files:**
- Create: `components/SelectableNumberGrid.tsx`
- Test: `components/__tests__/SelectableNumberGrid.test.tsx`

**Interfaces:**
- Produces: `SelectableNumberGrid` with props `{ selected: number[]; onToggle: (n: number) => void; max: number; disabled?: number[]; accent?: 'brand' | 'red' }`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import SelectableNumberGrid from '../SelectableNumberGrid'

function grid(props: Partial<React.ComponentProps<typeof SelectableNumberGrid>> = {}) {
  const onToggle = jest.fn()
  render(<SelectableNumberGrid selected={[]} onToggle={onToggle} max={5} {...props} />)
  return { onToggle }
}

it('toggles an unselected number', () => {
  const { onToggle } = grid()
  fireEvent.click(screen.getByRole('button', { name: '7' }))
  expect(onToggle).toHaveBeenCalledWith(7)
})

it('lets a selected number toggle off even at max', () => {
  const onToggle = jest.fn()
  render(<SelectableNumberGrid selected={[1, 2, 3, 4, 5]} onToggle={onToggle} max={5} />)
  fireEvent.click(screen.getByRole('button', { name: '3' }))
  expect(onToggle).toHaveBeenCalledWith(3)
})

it('does not toggle an unselected number once at max', () => {
  const onToggle = jest.fn()
  render(<SelectableNumberGrid selected={[1, 2, 3, 4, 5]} onToggle={onToggle} max={5} />)
  fireEvent.click(screen.getByRole('button', { name: '9' }))
  expect(onToggle).not.toHaveBeenCalled()
})

it('does not toggle a disabled number', () => {
  const onToggle = jest.fn()
  render(<SelectableNumberGrid selected={[]} onToggle={onToggle} max={5} disabled={[9]} />)
  fireEvent.click(screen.getByRole('button', { name: '9' }))
  expect(onToggle).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest components/__tests__/SelectableNumberGrid.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/SelectableNumberGrid.tsx`**

```tsx
import LottoBall from './LottoBall'

const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1)

interface Props {
  selected: number[]
  onToggle: (n: number) => void
  max: number
  disabled?: number[]
  accent?: 'brand' | 'red'
}

export default function SelectableNumberGrid({
  selected, onToggle, max, disabled = [], accent = 'brand',
}: Props) {
  const atMax = selected.length >= max
  const ring = accent === 'red' ? 'ring-red-400' : 'ring-brand'
  return (
    <div className="grid grid-cols-9 gap-1.5 justify-items-center">
      {ALL_NUMBERS.map((n) => {
        const isSelected = selected.includes(n)
        const isDisabled = !isSelected && (disabled.includes(n) || atMax)
        return (
          <button
            key={n}
            type="button"
            aria-label={String(n)}
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={() => onToggle(n)}
            className={`rounded-full transition ${
              isSelected ? `ring-2 ${ring} ring-offset-1 ring-offset-white` : ''
            } ${isDisabled ? 'opacity-30' : 'hover:scale-105'}`}
          >
            <LottoBall number={n} size="sm" />
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest components/__tests__/SelectableNumberGrid.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/SelectableNumberGrid.tsx components/__tests__/SelectableNumberGrid.test.tsx
git commit -m "feat: add SelectableNumberGrid (1-45 picker with max + disabled)"
```

---

### Task 4: Wire pickers + mode descriptions into `RecommenderClient`

**Files:**
- Modify: `components/RecommenderClient.tsx`
- Test: `components/__tests__/RecommenderClient.test.tsx` (create)

**Interfaces:**
- Consumes: `SelectableNumberGrid` (Task 3); `GET /api/recommend` with `mode`/`include`/`exclude` (Task 2).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecommenderClient from '../RecommenderClient'

describe('RecommenderClient', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it('shows the description for the selected mode', () => {
    render(<RecommenderClient />)
    // default mode is stats
    expect(screen.getByText(/저빈도/)).toBeInTheDocument()
  })

  it('sends include/exclude params when numbers are picked', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ numbers: [1, 2, 3, 4, 5, 6] }) })
    global.fetch = fetchMock as unknown as typeof fetch
    render(<RecommenderClient />)

    // pick include 7 (include grid is the first grid; label 7 appears in both grids,
    // so scope to the include section by its heading container)
    const includeSection = screen.getByTestId('include-grid')
    fireEvent.click(within(includeSection).getByRole('button', { name: '7' }))

    fireEvent.click(screen.getByRole('button', { name: /번호 추천받기/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('include=7')
  })
})
```

Add the `within` import: `import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'`.

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest components/__tests__/RecommenderClient.test.tsx`
Expected: FAIL — no description / no include grid / no testid yet.

- [ ] **Step 3: Implement in `components/RecommenderClient.tsx`**

```tsx
'use client'

import { useState } from 'react'
import BallSet from './BallSet'
import SelectableNumberGrid from './SelectableNumberGrid'
import type { RecommendMode } from '@/types/lotto'

const MODES: { key: RecommendMode; label: string; desc: string }[] = [
  { key: 'stats', label: '통계 기반', desc: '자주 나온 번호와 최근 보너스 번호를 피하고, 저빈도·중간 빈도 번호를 섞어 추천합니다.' },
  { key: 'exception', label: '제외 기반', desc: '통계 기반 규칙에 더해 8회차 전 당첨 번호에서 하나를 골라 변화를 줍니다.' },
  { key: 'random', label: '랜덤', desc: '1~45에서 완전 무작위로 6개를 뽑습니다.' },
]

export default function RecommenderClient() {
  const [mode, setMode] = useState<RecommendMode>('stats')
  const [include, setInclude] = useState<number[]>([])
  const [exclude, setExclude] = useState<number[]>([])
  const [numbers, setNumbers] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const desc = MODES.find(m => m.key === mode)!.desc

  function toggle(list: number[], set: (v: number[]) => void, max: number, n: number) {
    if (list.includes(n)) set(list.filter(x => x !== n))
    else if (list.length < max) set([...list, n])
  }

  async function generate() {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ mode })
      if (include.length) params.set('include', include.join(','))
      if (exclude.length) params.set('exclude', exclude.join(','))
      const res = await fetch(`/api/recommend?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNumbers(data.numbers)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card max-w-xl mx-auto">
      <div className="text-center">
        <div className="inline-flex flex-wrap justify-center p-1.5 rounded-full bg-emerald-50 gap-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-5 py-2.5 rounded-full text-sm transition ${
                mode === m.key
                  ? 'font-display bg-gradient-to-b from-brand to-brand-dark text-white shadow'
                  : 'text-gray-500 hover:bg-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-500">{desc}</p>
      </div>

      <div className="mt-6 space-y-5">
        <div data-testid="include-grid">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">포함할 번호</span>
            <span className="text-xs text-gray-400">{include.length} / 5</span>
          </div>
          <SelectableNumberGrid
            selected={include}
            onToggle={(n) => toggle(include, setInclude, 5, n)}
            max={5}
            disabled={exclude}
            accent="brand"
          />
        </div>
        <div data-testid="exclude-grid">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">제외할 번호</span>
            <span className="text-xs text-gray-400">{exclude.length} / 38</span>
          </div>
          <SelectableNumberGrid
            selected={exclude}
            onToggle={(n) => toggle(exclude, setExclude, 38, n)}
            max={38}
            disabled={include}
            accent="red"
          />
        </div>
      </div>

      <div className="mt-7 text-center">
        <button onClick={generate} disabled={loading} className="btn-gold">
          {loading ? '추첨 중...' : '🎱 번호 추천받기'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}

      {numbers.length > 0 && (
        <div className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-amber-50 border border-black/5 text-center">
          <p className="font-display text-brand-dark mb-4">✨ 당신의 행운 번호</p>
          <BallSet balls={numbers} className="justify-center flex-wrap" />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests + build**

Run: `npx jest components/__tests__/RecommenderClient.test.tsx`, then `npx jest`, then `npm run build`.
Expected: all pass; build clean.

- [ ] **Step 5: Commit**

```bash
git add components/RecommenderClient.tsx components/__tests__/RecommenderClient.test.tsx
git commit -m "feat: include/exclude pickers + mode descriptions on the recommend page"
```

---

## Final verification (after all tasks)

- [ ] `npx jest` — full suite green.
- [ ] `npm run build` — clean.
- [ ] Local `npm run start`:
  - `curl 'http://localhost:3100/api/recommend?mode=stats&include=7&exclude=1,2,3'` → 200, numbers contains 7, excludes 1/2/3, length 6.
  - `curl 'http://localhost:3100/api/recommend?mode=random&include=1,2,3,4,5,6'` → 400.
  - Browser `/`: pick a few 포함/제외 numbers (verify caps at 5 / 38 and that a number picked in one grid is disabled in the other), read the mode description, generate, confirm the result honors the picks.
