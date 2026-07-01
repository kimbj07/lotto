# 번추 결과 (Recommendation Results) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record every recommendation the app generates (tagged with its target draw round), grade it against the real result once drawn, and show an all-time aggregate plus per-round breakdowns by prize rank on a new 번추 결과 page.

**Architecture:** Two new Supabase tables — `recommendations` (raw picks) and `recommendation_summary` (materialized per-round aggregate). The recommend API records each generated set (service_role write). The weekly cron (sync route) grades newly-drawn rounds and rebuilds the summary table. A new `/results` page reads the pre-computed summary.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Supabase Postgres (`supabase.rpc` + table selects), Jest + Testing Library, Tailwind (OMC design system).

## Global Constraints

- Next.js 14 App Router (RSC + `'use client'` split); TypeScript strict; types snake_case.
- Public reads use the anon key (read-only). ALL writes go through `createAdminClient()` (service_role) — never the anon key.
- New tables follow the `supabase/migrations/004_grants.sql` least-privilege grant pattern (anon SELECT; service_role full).
- Korean UI copy. OMC design system: `.card`, `.btn-gold`, brand/gold color tokens, `font-display`.
- Prize-rank rule (single source of truth in `lib/rank.ts`): 6→1, 5+bonus→2, 5→3, 4→4, 3→5, else null.
- Route tests that import `next/server` handlers must use `/** @jest-environment node */`.
- Spec: `docs/superpowers/specs/2026-07-01-recommendation-results-design.md`.

---

### Task 1: Shared rank rule (`lib/rank.ts`) + refactor my-numbers

**Files:**
- Create: `lib/rank.ts`
- Modify: `app/api/my-numbers/route.ts` (replace local `computeRank`, import shared one)
- Test: `lib/__tests__/rank.test.ts`

**Interfaces:**
- Produces: `export function computeRank(winCount: number, bonusCount: number): 1 | 2 | 3 | 4 | 5 | null`

- [ ] **Step 1: Write the failing test** — `lib/__tests__/rank.test.ts`

```ts
import { computeRank } from '../rank'

describe('computeRank', () => {
  it('6 matches → 1등', () => expect(computeRank(6, 0)).toBe(1))
  it('5 matches + bonus → 2등', () => expect(computeRank(5, 1)).toBe(2))
  it('5 matches no bonus → 3등', () => expect(computeRank(5, 0)).toBe(3))
  it('4 matches → 4등', () => expect(computeRank(4, 0)).toBe(4))
  it('3 matches → 5등', () => expect(computeRank(3, 0)).toBe(5))
  it('2 matches → no prize', () => expect(computeRank(2, 0)).toBeNull())
  it('0 matches → no prize', () => expect(computeRank(0, 0)).toBeNull())
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest lib/__tests__/rank.test.ts`
Expected: FAIL — cannot find module `../rank`.

- [ ] **Step 3: Implement `lib/rank.ts`**

```ts
// Korean lotto prize-rank rule. Single source of truth shared by the
// my-numbers lookup and the recommendation grading path.
export function computeRank(
  winCount: number,
  bonusCount: number
): 1 | 2 | 3 | 4 | 5 | null {
  if (winCount === 6) return 1
  if (winCount === 5 && bonusCount === 1) return 2
  if (winCount === 5) return 3
  if (winCount === 4) return 4
  if (winCount === 3) return 5
  return null
}
```

- [ ] **Step 4: Refactor `app/api/my-numbers/route.ts`**

Delete the local `computeRank` function (lines defining it) and add at the top with the other imports:

```ts
import { computeRank } from '@/lib/rank'
```

Leave all call sites (`rank: computeRank(winCount, bonusCount)`) unchanged.

- [ ] **Step 5: Run tests to verify pass**

Run: `npx jest lib/__tests__/rank.test.ts app/api/my-numbers`
Expected: PASS (new rank tests green; my-numbers tests, if any, still green). Then `npx jest` — full suite green.

- [ ] **Step 6: Commit**

```bash
git add lib/rank.ts lib/__tests__/rank.test.ts app/api/my-numbers/route.ts
git commit -m "refactor: extract computeRank into shared lib/rank.ts"
```

---

### Task 2: Migration `005_recommendations.sql` (tables, functions, grants)

**Files:**
- Create: `supabase/migrations/005_recommendations.sql`

**Interfaces:**
- Produces (DB): tables `recommendations`, `recommendation_summary`; functions `grade_recommendations(integer)`, `refresh_recommendation_summary()`.
- `recommendations` columns: `id bigserial pk, target_game_no int, mode text, numbers int[], rank smallint null, graded bool default false, created_at timestamptz default now()`.
- `recommendation_summary` columns: `target_game_no int pk, total int, graded_count int, rank1..rank5 int, updated_at timestamptz`.

This task delivers a SQL file. It is verified by applying it to the Supabase project and running the check queries in Step 3 (there is no local Postgres; verification is against the hosted DB via the Supabase SQL editor or `psql`).

- [ ] **Step 1: Write the migration** — `supabase/migrations/005_recommendations.sql`

```sql
-- Migration: 005_recommendations
-- Records every recommendation the app generates (tagged with its target draw
-- round) plus a materialized per-round summary rebuilt by the cron.

CREATE TABLE IF NOT EXISTS recommendations (
  id              BIGSERIAL   PRIMARY KEY,
  target_game_no  INTEGER     NOT NULL,
  mode            TEXT        NOT NULL,
  numbers         INTEGER[]   NOT NULL,
  rank            SMALLINT,
  graded          BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recommendations_numbers_len CHECK (array_length(numbers, 1) = 6)
);
CREATE INDEX IF NOT EXISTS recommendations_target_idx ON recommendations (target_game_no);

CREATE TABLE IF NOT EXISTS recommendation_summary (
  target_game_no  INTEGER     PRIMARY KEY,
  total           INTEGER     NOT NULL DEFAULT 0,
  graded_count    INTEGER     NOT NULL DEFAULT 0,
  rank1           INTEGER     NOT NULL DEFAULT 0,
  rank2           INTEGER     NOT NULL DEFAULT 0,
  rank3           INTEGER     NOT NULL DEFAULT 0,
  rank4           INTEGER     NOT NULL DEFAULT 0,
  rank5           INTEGER     NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grade all ungraded recommendations for a drawn round against its result.
CREATE OR REPLACE FUNCTION grade_recommendations(p_game_no INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE recommendations r
  SET graded = true,
      rank = CASE
        WHEN sub.wc = 6 THEN 1
        WHEN sub.wc = 5 AND sub.bc = 1 THEN 2
        WHEN sub.wc = 5 THEN 3
        WHEN sub.wc = 4 THEN 4
        WHEN sub.wc = 3 THEN 5
        ELSE NULL
      END
  FROM (
    SELECT r2.id,
      (SELECT count(*) FROM win_numbers w
         WHERE w.game_no = p_game_no AND w.number = ANY(r2.numbers)) AS wc,
      (SELECT count(*) FROM bonus_number b
         WHERE b.game_no = p_game_no AND b.number = ANY(r2.numbers)) AS bc
    FROM recommendations r2
    WHERE r2.target_game_no = p_game_no AND r2.graded = false
  ) sub
  WHERE r.id = sub.id;
END;
$$;

-- Rebuild the per-round summary table from raw recommendations.
CREATE OR REPLACE FUNCTION refresh_recommendation_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM recommendation_summary;
  INSERT INTO recommendation_summary
    (target_game_no, total, graded_count, rank1, rank2, rank3, rank4, rank5, updated_at)
  SELECT
    target_game_no,
    count(*)::int,
    count(*) FILTER (WHERE graded)::int,
    count(*) FILTER (WHERE rank = 1)::int,
    count(*) FILTER (WHERE rank = 2)::int,
    count(*) FILTER (WHERE rank = 3)::int,
    count(*) FILTER (WHERE rank = 4)::int,
    count(*) FILTER (WHERE rank = 5)::int,
    now()
  FROM recommendations
  GROUP BY target_game_no;
END;
$$;

-- Grants (mirror 004_grants.sql least-privilege pattern)
GRANT SELECT ON public.recommendations        TO anon, authenticated;
GRANT SELECT ON public.recommendation_summary TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations        TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_summary TO service_role;
GRANT USAGE, SELECT ON SEQUENCE recommendations_id_seq TO service_role;
GRANT EXECUTE ON FUNCTION grade_recommendations(integer)   TO service_role;
GRANT EXECUTE ON FUNCTION refresh_recommendation_summary() TO anon, authenticated, service_role;
```

- [ ] **Step 2: Apply the migration to Supabase**

Paste the file into the Supabase SQL editor (project `lotto`) and run it. Expected: "Success. No rows returned."

- [ ] **Step 3: Verify functions against real data**

Run in the SQL editor (uses round 1230's real winning numbers to force a 1등, and a non-matching set for no-prize):

```sql
-- seed two sample picks for round 1230
INSERT INTO recommendations (target_game_no, mode, numbers)
SELECT 1230, 'stats', array_agg(number ORDER BY sequence)
FROM win_numbers WHERE game_no = 1230;            -- exact winning set → 1등
INSERT INTO recommendations (target_game_no, mode, numbers)
VALUES (1230, 'random', ARRAY[2,4,6,10,11,13]);   -- unlikely to match → no prize

SELECT grade_recommendations(1230);
SELECT refresh_recommendation_summary();
SELECT * FROM recommendation_summary WHERE target_game_no = 1230;
-- Expect: total 2, graded_count 2, rank1 1, rank5/other counts per matches.

-- cleanup
DELETE FROM recommendations WHERE target_game_no = 1230;
SELECT refresh_recommendation_summary();
```

Expected: the summary row shows `total = 2`, `graded_count = 2`, `rank1 = 1`; cleanup empties it.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/005_recommendations.sql
git commit -m "feat: add recommendations + summary tables, grading/refresh functions"
```

---

### Task 3: Record every generated recommendation (recommend route)

**Files:**
- Modify: `app/api/recommend/route.ts`
- Test: `app/api/recommend/__tests__/route.test.ts` (create)

**Interfaces:**
- Consumes: `createAdminClient` from `@/lib/supabase`; inserts into `recommendations` `{ target_game_no, mode, numbers }`.
- Produces: none (side effect only). Recording is best-effort — a failure must never change the recommend response.

- [ ] **Step 1: Write the failing test** — `app/api/recommend/__tests__/route.test.ts`

```ts
/**
 * @jest-environment node
 */
import { GET } from '../route'

const insertMock = jest.fn().mockResolvedValue({ error: null })
const singleMock = jest.fn().mockResolvedValue({ data: { game_no: 1230 } })
const adminFrom = jest.fn((table: string) => {
  if (table === 'recommendations') return { insert: insertMock }
  return { select: () => ({ order: () => ({ limit: () => ({ single: singleMock }) }) }) }
})
jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({ from: jest.fn(), rpc: jest.fn() }),
  createAdminClient: () => ({ from: adminFrom }),
}))

function makeReq(query: string) {
  return { nextUrl: new URL(`http://localhost/api/recommend?${query}`) } as never
}

beforeEach(() => {
  insertMock.mockClear().mockResolvedValue({ error: null })
  singleMock.mockClear().mockResolvedValue({ data: { game_no: 1230 } })
})

it('records a random recommendation tagged with the next round', async () => {
  const res = await GET(makeReq('mode=random'))
  const body = await res.json()
  expect(res.status).toBe(200)
  expect(body.numbers).toHaveLength(6)
  expect(insertMock).toHaveBeenCalledTimes(1)
  const row = insertMock.mock.calls[0][0]
  expect(row.target_game_no).toBe(1231) // latest 1230 + 1
  expect(row.mode).toBe('random')
  expect(row.numbers).toEqual(body.numbers)
})

it('still returns numbers when recording fails', async () => {
  insertMock.mockResolvedValue({ error: { message: 'boom' } })
  const res = await GET(makeReq('mode=random'))
  expect(res.status).toBe(200)
  expect((await res.json()).numbers).toHaveLength(6)
})

it('records the custom mode for the exclusions path', async () => {
  const res = await GET(makeReq('exclude=1,2,3'))
  expect(res.status).toBe(200)
  expect(insertMock).toHaveBeenCalledTimes(1)
  expect(insertMock.mock.calls[0][0].mode).toBe('custom')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest app/api/recommend`
Expected: FAIL — `insertMock` not called (route doesn't record yet).

- [ ] **Step 3: Implement recording in `app/api/recommend/route.ts`**

Add to imports (alongside the existing `createServerClient` import):

```ts
import { createServerClient, createAdminClient } from '@/lib/supabase'
```

Add this helper above `export async function GET`:

```ts
// Best-effort recording of a generated recommendation for later grading.
// Uses the service_role client (anon is read-only). Failures are swallowed so
// recording never breaks the recommendation response.
async function recordRecommendation(numbers: number[], mode: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: latestRow } = await admin
      .from('game_info')
      .select('game_no')
      .order('game_no', { ascending: false })
      .limit(1)
      .single()
    const latestNo = (latestRow?.game_no as number | undefined) ?? 0
    const { error } = await admin
      .from('recommendations')
      .insert({ target_game_no: latestNo + 1, mode, numbers })
    if (error) console.error('recordRecommendation failed:', error.message)
  } catch (e) {
    console.error('recordRecommendation threw:', e)
  }
}
```

Then record before each `return NextResponse.json({ numbers })`. Concretely:

Exclusions path — change:
```ts
    try {
      return NextResponse.json({ numbers: recommendWithExclusions(exclude) })
    } catch (e: unknown) {
```
to:
```ts
    try {
      const numbers = recommendWithExclusions(exclude)
      await recordRecommendation(numbers, 'custom')
      return NextResponse.json({ numbers })
    } catch (e: unknown) {
```

Random path — change:
```ts
  if (mode === 'random') {
    return NextResponse.json({ numbers: recommendRandom() })
  }
```
to:
```ts
  if (mode === 'random') {
    const numbers = recommendRandom()
    await recordRecommendation(numbers, 'random')
    return NextResponse.json({ numbers })
  }
```

Stats/exception path — change the final block:
```ts
    const numbers = mode === 'exception'
      ? recommendException(games, counts)
      : recommendStats(games, counts)
    return NextResponse.json({ numbers })
```
to:
```ts
    const numbers = mode === 'exception'
      ? recommendException(games, counts)
      : recommendStats(games, counts)
    await recordRecommendation(numbers, mode)
    return NextResponse.json({ numbers })
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest app/api/recommend`
Expected: PASS (3 tests). Then `npx jest` — full suite green.

- [ ] **Step 5: Commit**

```bash
git add app/api/recommend/route.ts app/api/recommend/__tests__/route.test.ts
git commit -m "feat: record every generated recommendation for grading"
```

---

### Task 4: Summary read route + types

**Files:**
- Modify: `types/lotto.ts` (add summary types)
- Create: `app/api/recommendations/summary/route.ts`
- Test: `app/api/recommendations/summary/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `recommendation_summary` rows.
- Produces: `GET /api/recommendations/summary` → `RecommendationSummary` JSON.

```ts
export interface RecommendationRoundSummary {
  target_game_no: number
  total: number
  graded_count: number
  rank1: number; rank2: number; rank3: number; rank4: number; rank5: number
}
export interface RecommendationSummary {
  allTime: { total: number; graded_count: number; rank1: number; rank2: number; rank3: number; rank4: number; rank5: number }
  rounds: RecommendationRoundSummary[]
}
```

- [ ] **Step 1: Add the types** to the end of `types/lotto.ts`

```ts
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
}
```

- [ ] **Step 2: Write the failing test** — `app/api/recommendations/summary/__tests__/route.test.ts`

```ts
/**
 * @jest-environment node
 */
import { GET } from '../route'

const orderMock = jest.fn()
jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({
    from: () => ({ select: () => ({ order: orderMock }) }),
  }),
}))

function row(target_game_no: number, over: Partial<Record<string, number>> = {}) {
  return { target_game_no, total: 10, graded_count: 10, rank1: 0, rank2: 0, rank3: 0, rank4: 1, rank5: 3, ...over }
}

beforeEach(() => orderMock.mockReset())

it('sums allTime and passes rounds through in order', async () => {
  orderMock.mockResolvedValue({ data: [row(100, { rank1: 1 }), row(99)], error: null })
  const res = await GET()
  const body = await res.json()
  expect(res.status).toBe(200)
  expect(body.rounds).toHaveLength(2)
  expect(body.rounds[0].target_game_no).toBe(100)
  expect(body.allTime.total).toBe(20)
  expect(body.allTime.rank1).toBe(1)
  expect(body.allTime.rank5).toBe(6)
})

it('returns zeros and empty rounds when there is no data', async () => {
  orderMock.mockResolvedValue({ data: [], error: null })
  const body = await (await GET()).json()
  expect(body.rounds).toEqual([])
  expect(body.allTime).toEqual({ total: 0, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx jest app/api/recommendations`
Expected: FAIL — cannot find module `../route`.

- [ ] **Step 4: Implement `app/api/recommendations/summary/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { RecommendationRoundSummary, RecommendationSummary } from '@/types/lotto'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('recommendation_summary')
    .select('*')
    .order('target_game_no', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rounds = (data as RecommendationRoundSummary[]) ?? []
  const allTime = rounds.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      graded_count: acc.graded_count + r.graded_count,
      rank1: acc.rank1 + r.rank1,
      rank2: acc.rank2 + r.rank2,
      rank3: acc.rank3 + r.rank3,
      rank4: acc.rank4 + r.rank4,
      rank5: acc.rank5 + r.rank5,
    }),
    { total: 0, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 }
  )

  const body: RecommendationSummary = { allTime, rounds }
  return NextResponse.json(body)
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npx jest app/api/recommendations`
Expected: PASS (2 tests). Then `npx jest` — full suite green.

- [ ] **Step 6: Commit**

```bash
git add types/lotto.ts app/api/recommendations/summary/route.ts app/api/recommendations/summary/__tests__/route.test.ts
git commit -m "feat: add recommendation summary read route + types"
```

---

### Task 5: Cron grades + rebuilds summary (sync route)

**Files:**
- Modify: `app/api/sync/route.ts`
- Test: `app/api/sync/__tests__/route.test.ts` (extend)

**Interfaces:**
- Consumes: `grade_recommendations(p_game_no)` and `refresh_recommendation_summary()` via `supabase.rpc` on the admin client.
- Produces: after each successful draw insert for round N, `grade_recommendations(N)` runs; after the loop, if `synced > 0`, `refresh_recommendation_summary()` runs once.

- [ ] **Step 1: Extend the test** — add to `app/api/sync/__tests__/route.test.ts`

First, ensure the mocked admin client exposes `rpc`. Update the `createAdminClient` mock so its returned object includes `rpc: rpcMock` where `const rpcMock = jest.fn().mockResolvedValue({ error: null })` is declared near `insertMock`, and add `rpcMock.mockClear()` to `beforeEach`. Then add:

```ts
it('grades each synced round and rebuilds the summary once', async () => {
  singleMock.mockResolvedValue({ data: { game_no: 1230 } })
  fetchLatest.mockResolvedValue(1231)
  fetchGame.mockResolvedValue(fullGame(1231))

  await GET(authedReq())

  expect(rpcMock).toHaveBeenCalledWith('grade_recommendations', { p_game_no: 1231 })
  expect(rpcMock).toHaveBeenCalledWith('refresh_recommendation_summary')
  expect(rpcMock.mock.calls.filter(c => c[0] === 'refresh_recommendation_summary')).toHaveLength(1)
})

it('does not grade or refresh when nothing is synced', async () => {
  singleMock.mockResolvedValue({ data: { game_no: 1231 } })
  fetchLatest.mockResolvedValue(1231)

  await GET(authedReq())

  expect(rpcMock).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest app/api/sync`
Expected: FAIL — `rpcMock` not called (route doesn't grade/refresh yet).

- [ ] **Step 3: Implement in `app/api/sync/route.ts`**

Inside the per-game loop, immediately after `synced++` (the point where a draw's rows are fully inserted), add:

```ts
    // Grade any recommendations that targeted this now-drawn round.
    await supabase.rpc('grade_recommendations', { p_game_no: gameInfo.game_no })
```

After the loop, replace the existing cache-eviction block:
```ts
  if (synced > 0) clearCache()
```
with:
```ts
  if (synced > 0) {
    clearCache()
    // Rebuild the materialized recommendation summary from the freshly graded rows.
    await supabase.rpc('refresh_recommendation_summary')
  }
```

(If Task “history cache” is not present in this branch, just add the `refresh_recommendation_summary` call under `if (synced > 0)`.)

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest app/api/sync`
Expected: PASS. Then `npx jest` — full suite green.

- [ ] **Step 5: Commit**

```bash
git add app/api/sync/route.ts app/api/sync/__tests__/route.test.ts
git commit -m "feat: cron grades recommendations and rebuilds the summary"
```

---

### Task 6: 번추 결과 page (route, client, nav)

**Files:**
- Create: `app/results/page.tsx`
- Create: `components/ResultsClient.tsx`
- Modify: `components/NavBar.tsx` (add nav link)
- Test: `components/__tests__/ResultsClient.test.tsx`

**Interfaces:**
- Consumes: `GET /api/recommendations/summary` → `RecommendationSummary`.

- [ ] **Step 1: Write the failing test** — `components/__tests__/ResultsClient.test.tsx`

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import ResultsClient from '../ResultsClient'

function summary(over: object = {}) {
  return {
    allTime: { total: 20, graded_count: 20, rank1: 1, rank2: 0, rank3: 0, rank4: 1, rank5: 6 },
    rounds: [
      { target_game_no: 100, total: 10, graded_count: 10, rank1: 1, rank2: 0, rank3: 0, rank4: 1, rank5: 3 },
      { target_game_no: 101, total: 10, graded_count: 5, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 3 },
    ],
    ...over,
  }
}

describe('ResultsClient', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it('renders the all-time card and per-round cards', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => summary() }) as unknown as typeof fetch
    render(<ResultsClient />)
    expect(await screen.findByText('전체 누적')).toBeInTheDocument()
    expect(screen.getByText('100회차')).toBeInTheDocument()
    expect(screen.getByText('101회차')).toBeInTheDocument()
    // round 101 is not fully graded → pending badge
    expect(screen.getByText('집계 예정')).toBeInTheDocument()
  })

  it('shows an empty state when there are no rounds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ allTime: { total: 0, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 }, rounds: [] }),
    }) as unknown as typeof fetch
    render(<ResultsClient />)
    expect(await screen.findByText('아직 집계된 번추 결과가 없습니다 🍀')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest components/__tests__/ResultsClient.test.tsx`
Expected: FAIL — cannot find module `../ResultsClient`.

- [ ] **Step 3: Implement `components/ResultsClient.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import type { RecommendationSummary, RecommendationRoundSummary } from '@/types/lotto'

const RANKS = [1, 2, 3, 4, 5] as const

function rankCounts(r: {
  rank1: number; rank2: number; rank3: number; rank4: number; rank5: number
}) {
  return [r.rank1, r.rank2, r.rank3, r.rank4, r.rank5]
}

function RankChips({
  r,
}: {
  r: { rank1: number; rank2: number; rank3: number; rank4: number; rank5: number }
}) {
  const counts = rankCounts(r)
  return (
    <div className="flex flex-wrap gap-2">
      {RANKS.map((rank, i) => (
        <span
          key={rank}
          className={`rounded-full px-3 py-1 text-sm ${
            rank === 1
              ? 'bg-gold/20 text-gold-dark font-display'
              : 'bg-black/5 text-gray-600'
          }`}
        >
          {rank}등 <b className="font-display">{counts[i]}</b>
        </span>
      ))}
    </div>
  )
}

export default function ResultsClient() {
  const [data, setData] = useState<RecommendationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/recommendations/summary')
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setData(json)
      } catch (e: unknown) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <p className="text-gray-400 text-center py-8">불러오는 중...</p>
  if (error) return <p className="text-red-500 text-center py-8">{error}</p>
  if (!data || data.rounds.length === 0) {
    return (
      <p className="text-gray-400 text-center py-10">
        아직 집계된 번추 결과가 없습니다 🍀
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card bg-brand/5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl text-gray-900">전체 누적</h2>
          <span className="text-sm text-gray-500">
            {data.allTime.total.toLocaleString()} 번추
          </span>
        </div>
        <RankChips r={data.allTime} />
      </div>

      <div className="space-y-3">
        {data.rounds.map((round: RecommendationRoundSummary) => {
          const pending = round.graded_count < round.total
          return (
            <div key={round.target_game_no} className="card !p-4 sm:!p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-display text-lg text-gray-900">
                  {round.target_game_no}회차
                </div>
                <div className="flex items-center gap-2">
                  {pending && (
                    <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2.5 py-1">
                      집계 예정
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {round.total.toLocaleString()} 번추
                  </span>
                </div>
              </div>
              <RankChips r={round} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement `app/results/page.tsx`**

```tsx
import PageHero from '@/components/PageHero'
import ResultsClient from '@/components/ResultsClient'

export default function ResultsPage() {
  return (
    <div>
      <PageHero
        emoji="🏆"
        title="번추 결과"
        subtitle="앱이 추천한 번호가 회차별로 몇 등에 당첨됐는지 확인합니다"
      />
      <ResultsClient />
    </div>
  )
}
```

- [ ] **Step 5: Add the nav link** in `components/NavBar.tsx`

In the `LINKS` array, add a final entry:

```ts
  { href: '/results', label: '번추 결과' },
```

- [ ] **Step 6: Run tests to verify pass**

Run: `npx jest components/__tests__/ResultsClient.test.tsx`
Expected: PASS (2 tests). Then `npx jest` — full suite green.

- [ ] **Step 7: Build + commit**

```bash
npm run build   # expect clean compile + lint
git add app/results/page.tsx components/ResultsClient.tsx components/NavBar.tsx components/__tests__/ResultsClient.test.tsx
git commit -m "feat: add 번추 결과 results page + nav link"
```

---

## Final verification (after all tasks)

- [ ] `npx jest` — full suite green (existing + new: rank, recommend route, summary route, sync additions, ResultsClient).
- [ ] `npm run build` — clean.
- [ ] Apply migration `005` to Supabase (prod) — manual dashboard step (like earlier migrations).
- [ ] Local end-to-end (`.env.local` present, `npm run start`):
  1. `curl 'http://localhost:3100/api/recommend?mode=stats'` a few times → 200 with numbers.
  2. In Supabase, `SELECT count(*) FROM recommendations WHERE target_game_no = <latest+1>;` → increases per call.
  3. `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3100/api/sync` → runs; if a new draw exists it grades + refreshes.
  4. `curl http://localhost:3100/api/recommendations/summary` → `{ allTime, rounds }` shaped correctly.
  5. Visit `/results` → all-time card + per-round cards (or empty state).
- [ ] After merge + deploy: trigger a manual `POST /api/sync` once to collect the summary without waiting for the weekly cron.

## Deployment note

Migration `005_recommendations.sql` must be applied to the Supabase project before the deployed code that reads/writes the new tables serves traffic. Recording (Task 3) and the summary route (Task 4) fail gracefully if the tables are missing (recording swallows errors; the summary route returns a 500 that the page shows as an error), but apply the migration as part of the same rollout to avoid a broken page.
