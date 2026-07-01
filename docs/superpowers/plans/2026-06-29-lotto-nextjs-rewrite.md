# Lotto Next.js + Supabase + Vercel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Java Spring MVC lotto service as a Next.js 14 app with Supabase (PostgreSQL), deployed to Vercel, with a fun/playful React UI.

**Architecture:** Next.js 14 App Router with React Server Components for initial page loads; API routes (`app/api/`) for mutations and client-driven interactions; Supabase JS client for DB access with `supabase.rpc()` for the two complex analytics queries. Vercel Cron Job calls `POST /api/sync` weekly to pull new draw results from the official API.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, `@supabase/supabase-js`, Vercel (hosting + cron), Jest + `@testing-library/react` for tests.

**Spec:** `docs/superpowers/specs/2026-06-29-lotto-nextjs-rewrite-design.md`

**Progress tracker:** `docs/superpowers/progress/lotto-nextjs-rewrite-progress.md`

## Global Constraints

- Next.js 14 with App Router (NOT Pages Router)
- TypeScript strict mode enabled
- All lotto numbers are integers 1–45; draws need exactly 6 unique numbers
- Official API base: `https://dhlottery.co.kr/common.do`
- User-Agent for API requests: `Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; MAAU; .NET4.0C; .NET4.0E; InfoPath.2; rv:11.0) like Gecko`
- Tailwind CSS for styling — no CSS modules
- No authentication — app is fully public
- New project lives in `lotto-next/` directory (sibling to the existing `lotto/` Java project)
- Supabase project: create at supabase.com, note `SUPABASE_URL` and `SUPABASE_ANON_KEY`

## Parallelization Map (for agent teams)

```
Phase 1 (sequential):  Task 1 → Task 2 → Task 3 → Task 4 → Task 5
Phase 2 (parallel):    Task 6 ║ Task 7          (both depend on Task 2 types only)
Phase 3 (parallel):    Task 8 ║ Task 9 ║ Task 10 ║ Task 11 ║ Task 12   (depend on Tasks 5-7)
Phase 4 (parallel):    Task 13 → [Task 14 ║ Task 15 ║ Task 16 ║ Task 17]
Phase 5 (sequential):  Task 18 → Task 19
```

---

### Task 1: Project Bootstrap

**Files:**
- Create: `lotto-next/` (new Next.js project)
- Create: `lotto-next/vercel.json`
- Create: `lotto-next/.env.example`

**Interfaces:**
- Produces: runnable `npm run dev` server on port 3000

- [ ] **Step 1: Scaffold the project**

```bash
cd /Users/tigger.kim/workspace
npx create-next-app@14 lotto-next \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-eslint
cd lotto-next
```

Expected: directory `lotto-next/` created with `app/`, `public/`, `package.json`, `tailwind.config.ts`, `next.config.ts`, `tsconfig.json`.

- [ ] **Step 2: Install Supabase client**

```bash
npm install @supabase/supabase-js
```

Expected: `@supabase/supabase-js` appears in `package.json` dependencies.

- [ ] **Step 3: Install test dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create `.env.example`**

Create `lotto-next/.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
CRON_SECRET=a-random-secret-for-protecting-the-cron-endpoint
```

Copy to `.env.local` and fill in real values from the Supabase dashboard.

- [ ] **Step 6: Create `vercel.json`**

Create `lotto-next/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 1 * * 0"
    }
  ]
}
```

Runs every Sunday at 01:00 UTC (10:00 KST), the morning after Saturday's draw.

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: `ready - started server on 0.0.0.0:3000`. Open `http://localhost:3000` — Next.js default page shows.

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 14 project with Supabase and Jest"
```

---

### Task 2: Shared TypeScript Types

**Files:**
- Create: `lotto-next/types/lotto.ts`

**Interfaces:**
- Produces: all shared types used by every subsequent task

- [ ] **Step 1: Write types**

Create `lotto-next/types/lotto.ts`:
```typescript
export interface GameInfo {
  gameNo: number
  gameDate: string          // ISO date string 'YYYY-MM-DD'
  firstBall: number
  secondBall: number
  thirdBall: number
  fourthBall: number
  fifthBall: number
  sixthBall: number
  bonusBall: number
  firstWinnerAmount: number
  firstWinnerCount: number
  totalFirstWinnerAmount: number
  secondWinnerAmount: number
  secondWinnerCount: number
  totalSecondWinnerAmount: number
  thirdWinnerAmount: number
  thirdWinnerCount: number
  totalThirdWinnerAmount: number
  fourthWinnerAmount: number
  fourthWinnerCount: number
  totalFourthWinnerAmount: number
  fifthWinnerAmount: number
  fifthWinnerCount: number
  totalFifthWinnerAmount: number
  totalWinnerCount: number
  totalAmount: number
  totalSellAmount: number
  manualWinnerCount: number
  autoWinnerCount: number
}

export interface AppearanceCount {
  number: number
  winCount: number
  bonusCount: number
  sumCount: number
}

export interface MyRankInGame {
  gameNo: number
  winNumberCount: number
  bonusNumberCount: number
  rank: 1 | 2 | 3 | 4 | 5 | null
}

export type RecommendMode = 'stats' | 'exception' | 'random'

export type SortOrder = 'ASC' | 'DESC'

export type AppearanceSortBy = 'winCount' | 'bonusCount' | 'sumCount' | 'number'
```

- [ ] **Step 2: Write type tests**

Create `lotto-next/types/__tests__/lotto.test.ts`:
```typescript
import type { GameInfo, AppearanceCount, MyRankInGame, RecommendMode } from '../lotto'

describe('lotto types', () => {
  it('GameInfo has all required fields', () => {
    const g: GameInfo = {
      gameNo: 1, gameDate: '2002-12-07',
      firstBall: 10, secondBall: 23, thirdBall: 29,
      fourthBall: 33, fifthBall: 37, sixthBall: 40,
      bonusBall: 16,
      firstWinnerAmount: 0, firstWinnerCount: 0, totalFirstWinnerAmount: 0,
      secondWinnerAmount: 0, secondWinnerCount: 0, totalSecondWinnerAmount: 0,
      thirdWinnerAmount: 0, thirdWinnerCount: 0, totalThirdWinnerAmount: 0,
      fourthWinnerAmount: 0, fourthWinnerCount: 0, totalFourthWinnerAmount: 0,
      fifthWinnerAmount: 0, fifthWinnerCount: 0, totalFifthWinnerAmount: 0,
      totalWinnerCount: 0, totalAmount: 0, totalSellAmount: 0,
      manualWinnerCount: 0, autoWinnerCount: 0,
    }
    expect(g.gameNo).toBe(1)
  })

  it('RecommendMode accepts only valid values', () => {
    const modes: RecommendMode[] = ['stats', 'exception', 'random']
    expect(modes).toHaveLength(3)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npx jest types/__tests__/lotto.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add types/
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: Supabase Schema (Tables)

**Files:**
- Create: `lotto-next/supabase/migrations/001_schema.sql`

**Interfaces:**
- Produces: `game_info`, `win_numbers`, `bonus_number`, `number_info` tables in Supabase

- [ ] **Step 1: Write migration SQL**

Create `lotto-next/supabase/migrations/001_schema.sql`:
```sql
-- Reference table: all possible lotto numbers 1-45
CREATE TABLE IF NOT EXISTS number_info (
  number INTEGER PRIMARY KEY
);
INSERT INTO number_info SELECT generate_series(1, 45)
ON CONFLICT DO NOTHING;

-- Draw results and prize information per game
CREATE TABLE IF NOT EXISTS game_info (
  game_no                       INTEGER PRIMARY KEY,
  game_date                     DATE NOT NULL,
  first_winner_amount           BIGINT DEFAULT 0,
  first_winner_count            INTEGER DEFAULT 0,
  total_first_winner_amount     BIGINT DEFAULT 0,
  second_winner_amount          BIGINT DEFAULT 0,
  second_winner_count           INTEGER DEFAULT 0,
  total_second_winner_amount    BIGINT DEFAULT 0,
  third_winner_amount           BIGINT DEFAULT 0,
  third_winner_count            INTEGER DEFAULT 0,
  total_third_winner_amount     BIGINT DEFAULT 0,
  fourth_winner_amount          BIGINT DEFAULT 0,
  fourth_winner_count           INTEGER DEFAULT 0,
  total_fourth_winner_amount    BIGINT DEFAULT 0,
  fifth_winner_amount           BIGINT DEFAULT 0,
  fifth_winner_count            INTEGER DEFAULT 0,
  total_fifth_winner_amount     BIGINT DEFAULT 0,
  total_winner_count            INTEGER DEFAULT 0,
  total_amount                  BIGINT DEFAULT 0,
  total_sell_amount             BIGINT DEFAULT 0,
  manual_winner_count           INTEGER DEFAULT 0,
  auto_winner_count             INTEGER DEFAULT 0
);

-- The 6 winning balls for each draw (sequence 1-6 in draw order)
CREATE TABLE IF NOT EXISTS win_numbers (
  game_no   INTEGER NOT NULL REFERENCES game_info(game_no) ON DELETE CASCADE,
  number    INTEGER NOT NULL CHECK (number BETWEEN 1 AND 45),
  sequence  INTEGER NOT NULL CHECK (sequence BETWEEN 1 AND 6),
  PRIMARY KEY (game_no, sequence)
);

-- The bonus ball for each draw
CREATE TABLE IF NOT EXISTS bonus_number (
  game_no  INTEGER PRIMARY KEY REFERENCES game_info(game_no) ON DELETE CASCADE,
  number   INTEGER NOT NULL CHECK (number BETWEEN 1 AND 45)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_win_numbers_game_no ON win_numbers(game_no);
CREATE INDEX IF NOT EXISTS idx_win_numbers_number ON win_numbers(number);
CREATE INDEX IF NOT EXISTS idx_bonus_number_number ON bonus_number(number);
```

- [ ] **Step 2: Run migration in Supabase**

In the Supabase dashboard → SQL Editor → paste `001_schema.sql` → Run.

Verify in Table Editor: `number_info` (45 rows), `game_info` (0 rows), `win_numbers` (0 rows), `bonus_number` (0 rows).

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema migration"
```

---

### Task 4: Supabase PostgreSQL Functions

**Files:**
- Create: `lotto-next/supabase/migrations/002_functions.sql`

**Interfaces:**
- Produces:
  - `get_game_info_in_range(p_from INT, p_to INT, p_order TEXT) RETURNS TABLE(...)`
  - `get_appearance_count(p_from INT, p_to INT, p_sort_by TEXT, p_sort_order TEXT, p_count INT) RETURNS TABLE(...)`
- Both called via `supabase.rpc('function_name', params)`

- [ ] **Step 1: Write SQL functions**

Create `lotto-next/supabase/migrations/002_functions.sql`:
```sql
-- Function: get_game_info_in_range
-- Pivots win_numbers rows (sequence 1-6) into columns (firstBall-sixthBall)
-- and joins with bonus_number and game_info.
-- Port of selectGameInfoInRange from sqlmap-lotto.xml.
CREATE OR REPLACE FUNCTION get_game_info_in_range(
  p_from    INTEGER DEFAULT NULL,
  p_to      INTEGER DEFAULT NULL,
  p_order   TEXT    DEFAULT 'DESC'
)
RETURNS TABLE (
  game_no                     INTEGER,
  game_date                   DATE,
  first_ball                  INTEGER,
  second_ball                 INTEGER,
  third_ball                  INTEGER,
  fourth_ball                 INTEGER,
  fifth_ball                  INTEGER,
  sixth_ball                  INTEGER,
  bonus_ball                  INTEGER,
  first_winner_amount         BIGINT,
  first_winner_count          INTEGER,
  total_first_winner_amount   BIGINT,
  second_winner_amount        BIGINT,
  second_winner_count         INTEGER,
  total_second_winner_amount  BIGINT,
  third_winner_amount         BIGINT,
  third_winner_count          INTEGER,
  total_third_winner_amount   BIGINT,
  fourth_winner_amount        BIGINT,
  fourth_winner_count         INTEGER,
  total_fourth_winner_amount  BIGINT,
  fifth_winner_amount         BIGINT,
  fifth_winner_count          INTEGER,
  total_fifth_winner_amount   BIGINT,
  total_winner_count          INTEGER,
  total_amount                BIGINT,
  total_sell_amount           BIGINT,
  manual_winner_count         INTEGER,
  auto_winner_count           INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT
       gi.game_no,
       gi.game_date,
       SUM(CASE WHEN wn.sequence = 1 THEN wn.number ELSE 0 END)::INTEGER AS first_ball,
       SUM(CASE WHEN wn.sequence = 2 THEN wn.number ELSE 0 END)::INTEGER AS second_ball,
       SUM(CASE WHEN wn.sequence = 3 THEN wn.number ELSE 0 END)::INTEGER AS third_ball,
       SUM(CASE WHEN wn.sequence = 4 THEN wn.number ELSE 0 END)::INTEGER AS fourth_ball,
       SUM(CASE WHEN wn.sequence = 5 THEN wn.number ELSE 0 END)::INTEGER AS fifth_ball,
       SUM(CASE WHEN wn.sequence = 6 THEN wn.number ELSE 0 END)::INTEGER AS sixth_ball,
       bn.number AS bonus_ball,
       gi.first_winner_amount,
       gi.first_winner_count,
       gi.total_first_winner_amount,
       gi.second_winner_amount,
       gi.second_winner_count,
       gi.total_second_winner_amount,
       gi.third_winner_amount,
       gi.third_winner_count,
       gi.total_third_winner_amount,
       gi.fourth_winner_amount,
       gi.fourth_winner_count,
       gi.total_fourth_winner_amount,
       gi.fifth_winner_amount,
       gi.fifth_winner_count,
       gi.total_fifth_winner_amount,
       gi.total_winner_count,
       gi.total_amount,
       gi.total_sell_amount,
       gi.manual_winner_count,
       gi.auto_winner_count
     FROM win_numbers wn
     JOIN game_info gi ON gi.game_no = wn.game_no
     JOIN bonus_number bn ON bn.game_no = wn.game_no
     %s
     GROUP BY gi.game_no, gi.game_date, bn.number,
              gi.first_winner_amount, gi.first_winner_count, gi.total_first_winner_amount,
              gi.second_winner_amount, gi.second_winner_count, gi.total_second_winner_amount,
              gi.third_winner_amount, gi.third_winner_count, gi.total_third_winner_amount,
              gi.fourth_winner_amount, gi.fourth_winner_count, gi.total_fourth_winner_amount,
              gi.fifth_winner_amount, gi.fifth_winner_count, gi.total_fifth_winner_amount,
              gi.total_winner_count, gi.total_amount, gi.total_sell_amount,
              gi.manual_winner_count, gi.auto_winner_count
     ORDER BY gi.game_no %s',
    CASE
      WHEN p_from IS NOT NULL AND p_to IS NOT NULL
      THEN format('WHERE wn.game_no BETWEEN %s AND %s', p_from, p_to)
      ELSE ''
    END,
    CASE WHEN upper(p_order) = 'ASC' THEN 'ASC' ELSE 'DESC' END
  );
END;
$$;

-- Function: get_appearance_count
-- Counts how often each number 1-45 appears as a win ball or bonus ball
-- within the requested game range. Port of selectAppearanceCount.
CREATE OR REPLACE FUNCTION get_appearance_count(
  p_from        INTEGER DEFAULT NULL,
  p_to          INTEGER DEFAULT NULL,
  p_sort_by     TEXT    DEFAULT 'winCount',
  p_sort_order  TEXT    DEFAULT 'DESC',
  p_count       INTEGER DEFAULT NULL
)
RETURNS TABLE (
  number      INTEGER,
  win_count   BIGINT,
  bonus_count BIGINT,
  sum_count   BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_sort_col   TEXT;
  v_sort_order TEXT;
  v_where      TEXT;
  v_limit      TEXT;
BEGIN
  v_sort_col := CASE p_sort_by
    WHEN 'bonusCount' THEN 'bonus_count'
    WHEN 'sumCount'   THEN 'sum_count'
    WHEN 'number'     THEN 'number'
    ELSE 'win_count'
  END;

  v_sort_order := CASE WHEN upper(p_sort_order) = 'ASC' THEN 'ASC' ELSE 'DESC' END;

  v_where := CASE
    WHEN p_from IS NOT NULL AND p_to IS NOT NULL
    THEN format('WHERE game_no BETWEEN %s AND %s', p_from, p_to)
    ELSE ''
  END;

  v_limit := CASE
    WHEN p_count IS NOT NULL THEN format('LIMIT %s', p_count)
    ELSE ''
  END;

  RETURN QUERY EXECUTE format(
    'SELECT
       ni.number,
       COALESCE(w.win_count, 0)   AS win_count,
       COALESCE(b.bonus_count, 0) AS bonus_count,
       COALESCE(w.win_count, 0) + COALESCE(b.bonus_count, 0) AS sum_count
     FROM number_info ni
     LEFT JOIN (
       SELECT number, COUNT(*)::BIGINT AS win_count
       FROM win_numbers %s
       GROUP BY number
     ) w ON ni.number = w.number
     LEFT JOIN (
       SELECT number, COUNT(*)::BIGINT AS bonus_count
       FROM bonus_number %s
       GROUP BY number
     ) b ON ni.number = b.number
     ORDER BY %I %s
     %s',
    v_where, v_where, v_sort_col, v_sort_order, v_limit
  );
END;
$$;
```

- [ ] **Step 2: Run migration in Supabase**

In the Supabase dashboard → SQL Editor → paste `002_functions.sql` → Run.

Verify: in SQL Editor run:
```sql
SELECT * FROM get_appearance_count(NULL, NULL, 'winCount', 'DESC', 10);
```
Expected: 10 rows, all with `win_count = 0` and `bonus_count = 0` (no data yet).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_functions.sql
git commit -m "feat: add PostgreSQL functions for complex lotto queries"
```

---

### Task 5: Supabase Client

**Files:**
- Create: `lotto-next/lib/supabase.ts`

**Interfaces:**
- Produces:
  - `createServerClient(): SupabaseClient` — for use in Server Components and API routes
  - `createBrowserClient(): SupabaseClient` — for use in Client Components

- [ ] **Step 1: Write Supabase client module**

Create `lotto-next/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side client (used in Server Components and API routes)
// Not cached — each call returns a fresh client suitable for server context.
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
}

// Browser-side singleton (used in Client Components)
let browserClient: ReturnType<typeof createClient> | null = null
export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}
```

- [ ] **Step 2: Write connectivity test**

Create `lotto-next/lib/__tests__/supabase.test.ts`:
```typescript
import { createServerClient } from '../supabase'

describe('supabase client', () => {
  it('createServerClient returns a client with correct url', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    const client = createServerClient()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe('function')
    expect(typeof client.rpc).toBe('function')
  })
})
```

- [ ] **Step 3: Run test**

```bash
npx jest lib/__tests__/supabase.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/supabase.ts lib/__tests__/supabase.test.ts
git commit -m "feat: add Supabase client module"
```

---

### Task 6: Lotto Official API Client

**Files:**
- Create: `lotto-next/lib/lotto-api.ts`

**Interfaces:**
- Produces:
  - `getLatestGameNo(): Promise<number>` — scrapes main page for current draw number
  - `fetchGameInfo(gameNo: number): Promise<GameInfo | null>` — fetches single draw's JSON

- [ ] **Step 1: Write failing tests**

Create `lotto-next/lib/__tests__/lotto-api.test.ts`:
```typescript
import { parseLatestGameNo, parseGameInfo } from '../lotto-api'

describe('parseLatestGameNo', () => {
  it('extracts game number from HTML with lottoDrwNo element', () => {
    const html = '<html><strong id="lottoDrwNo">1178</strong></html>'
    expect(parseLatestGameNo(html)).toBe(1178)
  })

  it('returns 0 when element is not found', () => {
    const html = '<html>no element here</html>'
    expect(parseLatestGameNo(html)).toBe(0)
  })
})

describe('parseGameInfo', () => {
  it('maps API JSON fields to GameInfo', () => {
    const json = {
      returnValue: 'success',
      drwNo: 1,
      drwNoDate: '2002-12-07',
      drwtNo1: 10, drwtNo2: 23, drwtNo3: 29,
      drwtNo4: 33, drwtNo5: 37, drwtNo6: 40,
      bnusNo: 16,
      firstPrzwnerCo: 3,
      firstWinamnt: 2000000000,
      totFirstPrzamnt: 6000000000,
      secondPrzwnerCo: 0, secondWinamnt: 0, totSecondPrzamnt: 0,
      thirdPrzwnerCo: 0, thirdWinamnt: 0, totThirdPrzamnt: 0,
      fourthPrzwnerCo: 0, fourthWinamnt: 0, totFourthPrzamnt: 0,
      fifthPrzwnerCo: 0, fifthWinamnt: 0, totFifthPrzamnt: 0,
      totPrzwnerCo: 3, totPrzamnt: 6000000000, totSellamnt: 20000000000,
    }
    const result = parseGameInfo(json)
    expect(result).not.toBeNull()
    expect(result!.gameNo).toBe(1)
    expect(result!.gameDate).toBe('2002-12-07')
    expect(result!.firstBall).toBe(10)
    expect(result!.sixthBall).toBe(40)
    expect(result!.bonusBall).toBe(16)
    expect(result!.firstWinnerCount).toBe(3)
  })

  it('returns null when returnValue is not success', () => {
    const json = { returnValue: 'fail' }
    expect(parseGameInfo(json)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest lib/__tests__/lotto-api.test.ts
```

Expected: FAIL — `parseLatestGameNo` and `parseGameInfo` not defined.

- [ ] **Step 3: Implement lotto-api.ts**

Create `lotto-next/lib/lotto-api.ts`:
```typescript
import type { GameInfo } from '@/types/lotto'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; MAAU; .NET4.0C; .NET4.0E; InfoPath.2; rv:11.0) like Gecko'

const BASE_URL = 'https://dhlottery.co.kr/common.do'

// Exported for unit testing without network calls
export function parseLatestGameNo(html: string): number {
  const match = html.match(/<strong id="lottoDrwNo">(\d+)<\/strong>/)
  if (!match) return 0
  return parseInt(match[1], 10)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGameInfo(json: any): GameInfo | null {
  if (json?.returnValue !== 'success') return null
  return {
    gameNo: json.drwNo,
    gameDate: json.drwNoDate,
    firstBall: json.drwtNo1,
    secondBall: json.drwtNo2,
    thirdBall: json.drwtNo3,
    fourthBall: json.drwtNo4,
    fifthBall: json.drwtNo5,
    sixthBall: json.drwtNo6,
    bonusBall: json.bnusNo,
    firstWinnerAmount: json.firstWinamnt ?? 0,
    firstWinnerCount: json.firstPrzwnerCo ?? 0,
    totalFirstWinnerAmount: json.totFirstPrzamnt ?? 0,
    secondWinnerAmount: json.secondWinamnt ?? 0,
    secondWinnerCount: json.secondPrzwnerCo ?? 0,
    totalSecondWinnerAmount: json.totSecondPrzamnt ?? 0,
    thirdWinnerAmount: json.thirdWinamnt ?? 0,
    thirdWinnerCount: json.thirdPrzwnerCo ?? 0,
    totalThirdWinnerAmount: json.totThirdPrzamnt ?? 0,
    fourthWinnerAmount: json.fourthWinamnt ?? 0,
    fourthWinnerCount: json.fourthPrzwnerCo ?? 0,
    totalFourthWinnerAmount: json.totFourthPrzamnt ?? 0,
    fifthWinnerAmount: json.fifthWinamnt ?? 0,
    fifthWinnerCount: json.fifthPrzwnerCo ?? 0,
    totalFifthWinnerAmount: json.totFifthPrzamnt ?? 0,
    totalWinnerCount: json.totPrzwnerCo ?? 0,
    totalAmount: json.totPrzamnt ?? 0,
    totalSellAmount: json.totSellamnt ?? 0,
    manualWinnerCount: 0,
    autoWinnerCount: 0,
  }
}

export async function getLatestGameNo(): Promise<number> {
  const res = await fetch(`${BASE_URL}?method=main`, {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  })
  const html = await res.text()
  return parseLatestGameNo(html)
}

export async function fetchGameInfo(gameNo: number): Promise<GameInfo | null> {
  const res = await fetch(`${BASE_URL}?method=getLottoNumber&drwNo=${gameNo}`, {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  })
  const json = await res.json()
  return parseGameInfo(json)
}
```

- [ ] **Step 4: Run tests — confirm PASS**

```bash
npx jest lib/__tests__/lotto-api.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/lotto-api.ts lib/__tests__/lotto-api.test.ts
git commit -m "feat: add official lotto API client with unit-testable parsers"
```

---

### Task 7: Recommendation Logic

**Files:**
- Create: `lotto-next/lib/recommend.ts`

**Interfaces:**
- Consumes: `GameInfo` from `@/types/lotto`, `AppearanceCount` from `@/types/lotto`
- Produces:
  - `recommendStats(games: GameInfo[], counts: AppearanceCount[]): number[]` — stats-based (port of `recommendNumbers`)
  - `recommendException(games: GameInfo[], counts: AppearanceCount[]): number[]` — excludes recent bonus balls + top frequency (port of `recommendExceptionNumbers`)
  - `recommendRandom(): number[]` — simple shuffle of 1-45, pick 6
  - `recommendWithExclusions(exclude: number[]): number[]` — user-supplied exclusions

**Notes on porting from Java:**
- `recommendRandomNumbers()` in Java does 19,820,921 random iterations (impractical for serverless). Replaced with a simple Fisher-Yates shuffle.
- `recommendExceptionNumbers()` in Java requires `N_WEEKS_AGO = 8` game infos. The function gets games from the last 10 draws, so this is satisfied.
- Constants: `MAX_APPEARANCE_LIMIT_INDEX = 2` (exclude top 2 most frequent), `LATEST_GAME_LIMIT_INDEX = 2` (exclude last 2 bonus balls), `MIN_APPEARANCE_LIMIT_INDEX = 9` (pick from bottom 9), `N_WEEKS_AGO = 8`.

- [ ] **Step 1: Write failing tests**

Create `lotto-next/lib/__tests__/recommend.test.ts`:
```typescript
import {
  recommendRandom,
  recommendWithExclusions,
  recommendStats,
  recommendException,
} from '../recommend'
import type { GameInfo, AppearanceCount } from '@/types/lotto'

function makeGame(gameNo: number, balls: number[], bonus: number): GameInfo {
  return {
    gameNo, gameDate: '2024-01-01',
    firstBall: balls[0], secondBall: balls[1], thirdBall: balls[2],
    fourthBall: balls[3], fifthBall: balls[4], sixthBall: balls[5],
    bonusBall: bonus,
    firstWinnerAmount: 0, firstWinnerCount: 0, totalFirstWinnerAmount: 0,
    secondWinnerAmount: 0, secondWinnerCount: 0, totalSecondWinnerAmount: 0,
    thirdWinnerAmount: 0, thirdWinnerCount: 0, totalThirdWinnerAmount: 0,
    fourthWinnerAmount: 0, fourthWinnerCount: 0, totalFourthWinnerAmount: 0,
    fifthWinnerAmount: 0, fifthWinnerCount: 0, totalFifthWinnerAmount: 0,
    totalWinnerCount: 0, totalAmount: 0, totalSellAmount: 0,
    manualWinnerCount: 0, autoWinnerCount: 0,
  }
}

function makeCounts(): AppearanceCount[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    winCount: 45 - i,
    bonusCount: 1,
    sumCount: 46 - i,
  }))
}

describe('recommendRandom', () => {
  it('returns exactly 6 unique numbers between 1 and 45', () => {
    const result = recommendRandom()
    expect(result).toHaveLength(6)
    expect(new Set(result).size).toBe(6)
    result.forEach(n => expect(n).toBeGreaterThanOrEqual(1))
    result.forEach(n => expect(n).toBeLessThanOrEqual(45))
  })
})

describe('recommendWithExclusions', () => {
  it('returns 6 numbers not in exclusion list', () => {
    const exclude = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = recommendWithExclusions(exclude)
    expect(result).toHaveLength(6)
    result.forEach(n => expect(exclude).not.toContain(n))
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
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest lib/__tests__/recommend.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement recommend.ts**

Create `lotto-next/lib/recommend.ts`:
```typescript
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
  // counts must be sorted DESC by winCount (most frequent first)
  const available = new Set(ALL_NUMBERS)

  // Exclude top MAX_APPEARANCE_LIMIT most frequent numbers
  counts.slice(0, MAX_APPEARANCE_LIMIT).forEach(c => available.delete(c.number))

  // Exclude last LATEST_BONUS_LIMIT bonus balls
  games.slice(0, LATEST_BONUS_LIMIT).forEach(g => available.delete(g.bonusBall))

  const availableArr = Array.from(available)
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
  games.slice(0, LATEST_BONUS_LIMIT).forEach(g => available.delete(g.bonusBall))

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
      nWeeksGame.firstBall, nWeeksGame.secondBall, nWeeksGame.thirdBall,
      nWeeksGame.fourthBall, nWeeksGame.fifthBall, nWeeksGame.sixthBall,
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
```

- [ ] **Step 4: Run tests — confirm PASS**

```bash
npx jest lib/__tests__/recommend.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/recommend.ts lib/__tests__/recommend.test.ts
git commit -m "feat: add recommendation logic ported from LottoRandomMachine"
```

---

### Task 8: API Route — Sync

**Files:**
- Create: `lotto-next/app/api/sync/route.ts`

**Interfaces:**
- Consumes: `getLatestGameNo`, `fetchGameInfo` from `@/lib/lotto-api`; `createServerClient` from `@/lib/supabase`
- Produces: `POST /api/sync` → `{ synced: number, skipped: number }`

- [ ] **Step 1: Write the route**

Create `lotto-next/app/api/sync/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getLatestGameNo, fetchGameInfo } from '@/lib/lotto-api'

// Called by Vercel Cron (see vercel.json) and manually via POST /api/sync.
// Protected by CRON_SECRET when called from outside Vercel infra.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  // Vercel sets x-vercel-signature for cron; allow bare secret too for manual calls
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  // 1. Get latest game number from official site
  const latestGameNo = await getLatestGameNo()
  if (latestGameNo === 0) {
    return NextResponse.json({ error: 'Could not fetch latest game number' }, { status: 502 })
  }

  // 2. Get last saved game number from DB
  const { data: maxRow } = await supabase
    .from('game_info')
    .select('game_no')
    .order('game_no', { ascending: false })
    .limit(1)
    .single()

  const lastSavedGameNo = maxRow?.game_no ?? 0

  let synced = 0
  let skipped = 0

  // 3. Insert each missing game
  for (let gameNo = lastSavedGameNo + 1; gameNo <= latestGameNo; gameNo++) {
    const gameInfo = await fetchGameInfo(gameNo)
    if (!gameInfo) {
      skipped++
      continue
    }

    // Insert game_info row
    const { error: giError } = await supabase.from('game_info').insert({
      game_no: gameInfo.gameNo,
      game_date: gameInfo.gameDate,
      first_winner_amount: gameInfo.firstWinnerAmount,
      first_winner_count: gameInfo.firstWinnerCount,
      total_first_winner_amount: gameInfo.totalFirstWinnerAmount,
      second_winner_amount: gameInfo.secondWinnerAmount,
      second_winner_count: gameInfo.secondWinnerCount,
      total_second_winner_amount: gameInfo.totalSecondWinnerAmount,
      third_winner_amount: gameInfo.thirdWinnerAmount,
      third_winner_count: gameInfo.thirdWinnerCount,
      total_third_winner_amount: gameInfo.totalThirdWinnerAmount,
      fourth_winner_amount: gameInfo.fourthWinnerAmount,
      fourth_winner_count: gameInfo.fourthWinnerCount,
      total_fourth_winner_amount: gameInfo.totalFourthWinnerAmount,
      fifth_winner_amount: gameInfo.fifthWinnerAmount,
      fifth_winner_count: gameInfo.fifthWinnerCount,
      total_fifth_winner_amount: gameInfo.totalFifthWinnerAmount,
      total_winner_count: gameInfo.totalWinnerCount,
      total_amount: gameInfo.totalAmount,
      total_sell_amount: gameInfo.totalSellAmount,
      manual_winner_count: gameInfo.manualWinnerCount,
      auto_winner_count: gameInfo.autoWinnerCount,
    })
    if (giError) { skipped++; continue }

    // Insert 6 win_numbers rows
    const balls = [
      gameInfo.firstBall, gameInfo.secondBall, gameInfo.thirdBall,
      gameInfo.fourthBall, gameInfo.fifthBall, gameInfo.sixthBall,
    ]
    await supabase.from('win_numbers').insert(
      balls.map((number, i) => ({ game_no: gameInfo.gameNo, number, sequence: i + 1 }))
    )

    // Insert bonus_number row
    await supabase.from('bonus_number').insert({
      game_no: gameInfo.gameNo,
      number: gameInfo.bonusBall,
    })

    synced++

    // Brief pause to avoid hammering the official API
    await new Promise(r => setTimeout(r, 300))
  }

  return NextResponse.json({ synced, skipped, latestGameNo, lastSavedGameNo })
}
```

- [ ] **Step 2: Manual smoke test**

With `.env.local` filled in and `npm run dev` running:
```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)"
```

Expected: `{"synced": N, "skipped": 0, "latestGameNo": ..., "lastSavedGameNo": 0}` on first run.

Check Supabase dashboard → Table Editor → `game_info` should have rows.

- [ ] **Step 3: Commit**

```bash
git add app/api/sync/
git commit -m "feat: add sync API route with Vercel Cron support"
```

---

### Task 9: API Route — Recommend

**Files:**
- Create: `lotto-next/app/api/recommend/route.ts`

**Interfaces:**
- Consumes: `createServerClient`, `recommendStats`, `recommendException`, `recommendRandom`, `recommendWithExclusions`
- Produces: `GET /api/recommend?mode=stats|exception|random&exclude=1,2,3` → `{ numbers: number[] }`

- [ ] **Step 1: Write the route**

Create `lotto-next/app/api/recommend/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  recommendStats,
  recommendException,
  recommendRandom,
  recommendWithExclusions,
} from '@/lib/recommend'
import type { GameInfo, AppearanceCount } from '@/types/lotto'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode = searchParams.get('mode') ?? 'stats'
  const excludeParam = searchParams.get('exclude')

  if (!['stats', 'exception', 'random'].includes(mode)) {
    return NextResponse.json({ error: 'mode must be stats, exception, or random' }, { status: 400 })
  }

  // User-supplied exclusions (comma-separated)
  if (excludeParam) {
    const exclude = excludeParam.split(',').map(Number).filter(n => n >= 1 && n <= 45)
    try {
      return NextResponse.json({ numbers: recommendWithExclusions(exclude) })
    } catch (e: unknown) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 })
    }
  }

  if (mode === 'random') {
    return NextResponse.json({ numbers: recommendRandom() })
  }

  const supabase = createServerClient()

  // Fetch last 10 games for stats-based recommendation
  const { data: gamesRaw, error: gamesErr } = await supabase.rpc('get_game_info_in_range', {
    p_from: null, p_to: null, p_order: 'DESC',
  })
  if (gamesErr) return NextResponse.json({ error: gamesErr.message }, { status: 500 })
  const games = (gamesRaw as GameInfo[]).slice(0, 10)

  // Fetch appearance counts sorted by win count DESC
  const { data: countsRaw, error: countsErr } = await supabase.rpc('get_appearance_count', {
    p_from: null, p_to: null,
    p_sort_by: 'winCount', p_sort_order: 'DESC', p_count: null,
  })
  if (countsErr) return NextResponse.json({ error: countsErr.message }, { status: 500 })
  const counts = countsRaw as AppearanceCount[]

  try {
    const numbers = mode === 'exception'
      ? recommendException(games, counts)
      : recommendStats(games, counts)
    return NextResponse.json({ numbers })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Smoke test**

```bash
curl "http://localhost:3000/api/recommend?mode=random"
# Expected: {"numbers":[n1,n2,n3,n4,n5,n6]}

curl "http://localhost:3000/api/recommend?mode=stats"
# Expected: {"numbers":[...]} (requires data in DB)

curl "http://localhost:3000/api/recommend?mode=bad"
# Expected: 400 {"error":"mode must be stats, exception, or random"}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/recommend/
git commit -m "feat: add recommend API route"
```

---

### Task 10: API Route — History

**Files:**
- Create: `lotto-next/app/api/history/route.ts`

**Interfaces:**
- Produces: `GET /api/history?from=&to=&order=ASC|DESC` → `{ games: GameInfo[] }`

- [ ] **Step 1: Write the route**

Create `lotto-next/app/api/history/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { GameInfo } from '@/types/lotto'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from') ? parseInt(searchParams.get('from')!, 10) : null
  const to = searchParams.get('to') ? parseInt(searchParams.get('to')!, 10) : null
  const order = searchParams.get('order') === 'ASC' ? 'ASC' : 'DESC'

  if (from !== null && (isNaN(from) || from < 1)) {
    return NextResponse.json({ error: 'from must be a positive integer' }, { status: 400 })
  }
  if (to !== null && (isNaN(to) || to < 1)) {
    return NextResponse.json({ error: 'to must be a positive integer' }, { status: 400 })
  }
  if (from !== null && to !== null && from > to) {
    return NextResponse.json({ error: 'from must be <= to' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('get_game_info_in_range', {
    p_from: from,
    p_to: to,
    p_order: order,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ games: data as GameInfo[] })
}
```

- [ ] **Step 2: Smoke test**

```bash
curl "http://localhost:3000/api/history?from=1&to=5&order=ASC"
# Expected: {"games":[...5 items...]}

curl "http://localhost:3000/api/history?from=5&to=1"
# Expected: 400
```

- [ ] **Step 3: Commit**

```bash
git add app/api/history/
git commit -m "feat: add history API route"
```

---

### Task 11: API Route — My Numbers

**Files:**
- Create: `lotto-next/app/api/my-numbers/route.ts`

**Interfaces:**
- Produces: `GET /api/my-numbers?n1=&n2=&n3=&n4=&n5=&n6=` → `{ results: MyRankInGame[] }`

**Rank logic** (ported from Java): rank 1 = 6 win matches; rank 2 = 5 win + 1 bonus; rank 3 = 5 win + 0 bonus; rank 4 = 4 win; rank 5 = 3 win.

- [ ] **Step 1: Write the route**

Create `lotto-next/app/api/my-numbers/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { MyRankInGame } from '@/types/lotto'

function computeRank(
  winCount: number,
  bonusCount: number
): MyRankInGame['rank'] {
  if (winCount === 6) return 1
  if (winCount === 5 && bonusCount === 1) return 2
  if (winCount === 5) return 3
  if (winCount === 4) return 4
  if (winCount === 3) return 5
  return null
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const numbers = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6']
    .map(k => parseInt(searchParams.get(k) ?? '', 10))

  if (numbers.some(isNaN)) {
    return NextResponse.json({ error: 'Provide n1 through n6 as integers' }, { status: 400 })
  }
  if (numbers.some(n => n < 1 || n > 45)) {
    return NextResponse.json({ error: 'All numbers must be between 1 and 45' }, { status: 400 })
  }
  if (new Set(numbers).size !== 6) {
    return NextResponse.json({ error: 'All 6 numbers must be unique' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Count win number matches per game
  const { data: winMatches, error: winErr } = await supabase
    .from('win_numbers')
    .select('game_no, number')
    .in('number', numbers)

  if (winErr) return NextResponse.json({ error: winErr.message }, { status: 500 })

  // Aggregate match counts per game
  const matchMap = new Map<number, { winCount: number; bonusCount: number }>()
  for (const row of winMatches ?? []) {
    const entry = matchMap.get(row.game_no) ?? { winCount: 0, bonusCount: 0 }
    entry.winCount++
    matchMap.set(row.game_no, entry)
  }

  // Only games with 3+ win matches qualify
  const qualifyingGameNos = Array.from(matchMap.entries())
    .filter(([, v]) => v.winCount >= 3)
    .map(([k]) => k)

  if (qualifyingGameNos.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // Check bonus ball matches for qualifying games
  const { data: bonusMatches, error: bonusErr } = await supabase
    .from('bonus_number')
    .select('game_no, number')
    .in('game_no', qualifyingGameNos)
    .in('number', numbers)

  if (bonusErr) return NextResponse.json({ error: bonusErr.message }, { status: 500 })

  for (const row of bonusMatches ?? []) {
    const entry = matchMap.get(row.game_no)
    if (entry) entry.bonusCount++
  }

  const results: MyRankInGame[] = qualifyingGameNos
    .map(gameNo => {
      const { winCount, bonusCount } = matchMap.get(gameNo)!
      return {
        gameNo,
        winNumberCount: winCount,
        bonusNumberCount: bonusCount,
        rank: computeRank(winCount, bonusCount),
      }
    })
    .sort((a, b) => a.gameNo - b.gameNo)

  return NextResponse.json({ results })
}
```

- [ ] **Step 2: Smoke test**

```bash
curl "http://localhost:3000/api/my-numbers?n1=1&n2=2&n3=3&n4=4&n5=5&n6=6"
# Expected: {"results":[...]} (may be empty if none match)

curl "http://localhost:3000/api/my-numbers?n1=1&n2=1&n3=3&n4=4&n5=5&n6=6"
# Expected: 400 - duplicates
```

- [ ] **Step 3: Commit**

```bash
git add app/api/my-numbers/
git commit -m "feat: add my-numbers API route with rank computation"
```

---

### Task 12: API Route — Stats

**Files:**
- Create: `lotto-next/app/api/stats/route.ts`

**Interfaces:**
- Produces: `GET /api/stats?from=&to=&sortBy=winCount|bonusCount|sumCount|number&order=ASC|DESC&count=` → `{ stats: AppearanceCount[] }`

- [ ] **Step 1: Write the route**

Create `lotto-next/app/api/stats/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { AppearanceCount, AppearanceSortBy, SortOrder } from '@/types/lotto'

const VALID_SORT_BY: AppearanceSortBy[] = ['winCount', 'bonusCount', 'sumCount', 'number']

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from') ? parseInt(searchParams.get('from')!, 10) : null
  const to = searchParams.get('to') ? parseInt(searchParams.get('to')!, 10) : null
  const sortBy = (searchParams.get('sortBy') ?? 'winCount') as AppearanceSortBy
  const order = (searchParams.get('order') === 'ASC' ? 'ASC' : 'DESC') as SortOrder
  const count = searchParams.get('count') ? parseInt(searchParams.get('count')!, 10) : null

  if (!VALID_SORT_BY.includes(sortBy)) {
    return NextResponse.json(
      { error: `sortBy must be one of: ${VALID_SORT_BY.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('get_appearance_count', {
    p_from: from,
    p_to: to,
    p_sort_by: sortBy,
    p_sort_order: order,
    p_count: count,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ stats: data as AppearanceCount[] })
}
```

- [ ] **Step 2: Smoke test**

```bash
curl "http://localhost:3000/api/stats?sortBy=winCount&order=DESC"
# Expected: {"stats":[{number:N, winCount:N, bonusCount:N, sumCount:N},...45 items]}

curl "http://localhost:3000/api/stats?sortBy=bad"
# Expected: 400
```

- [ ] **Step 3: Commit**

```bash
git add app/api/stats/
git commit -m "feat: add stats API route"
```

---

### Task 13: Base UI Components + Layout

**Files:**
- Create: `lotto-next/components/LottoBall.tsx`
- Create: `lotto-next/components/BallSet.tsx`
- Create: `lotto-next/components/NumberGrid.tsx`
- Modify: `lotto-next/app/layout.tsx`
- Modify: `lotto-next/app/globals.css`

**Note:** These are intentionally minimal structural components. The OMC designer owns the visual styling. The components expose clear props interfaces for the designer to style freely.

- [ ] **Step 1: Write component tests**

Create `lotto-next/components/__tests__/LottoBall.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import LottoBall from '../LottoBall'

describe('LottoBall', () => {
  it('renders the number', () => {
    render(<LottoBall number={7} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders bonus ball with isBonus prop', () => {
    render(<LottoBall number={13} isBonus />)
    const el = screen.getByText('13')
    expect(el.closest('[data-bonus]')).toHaveAttribute('data-bonus', 'true')
  })
})
```

Create `lotto-next/components/__tests__/BallSet.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import BallSet from '../BallSet'

describe('BallSet', () => {
  it('renders 6 balls and 1 bonus ball', () => {
    render(<BallSet balls={[1, 2, 3, 4, 5, 6]} bonusBall={7} />)
    ;[1, 2, 3, 4, 5, 6, 7].forEach(n => {
      expect(screen.getByText(String(n))).toBeInTheDocument()
    })
  })

  it('renders without bonus ball', () => {
    render(<BallSet balls={[10, 20, 30, 40, 41, 42]} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.queryByText('+')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest components/__tests__/
```

Expected: FAIL

- [ ] **Step 3: Implement components**

Create `lotto-next/components/LottoBall.tsx`:
```typescript
interface LottoBallProps {
  number: number
  isBonus?: boolean
  className?: string
}

export default function LottoBall({ number, isBonus = false, className = '' }: LottoBallProps) {
  return (
    <span
      data-bonus={isBonus ? 'true' : undefined}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
        isBonus
          ? 'bg-red-500 text-white'
          : 'bg-yellow-400 text-gray-900'
      } ${className}`}
    >
      {number}
    </span>
  )
}
```

Create `lotto-next/components/BallSet.tsx`:
```typescript
import LottoBall from './LottoBall'

interface BallSetProps {
  balls: number[]
  bonusBall?: number
  className?: string
}

export default function BallSet({ balls, bonusBall, className = '' }: BallSetProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {balls.map((n, i) => (
        <LottoBall key={i} number={n} />
      ))}
      {bonusBall !== undefined && (
        <>
          <span className="text-gray-400 font-bold">+</span>
          <LottoBall number={bonusBall} isBonus />
        </>
      )}
    </div>
  )
}
```

Create `lotto-next/components/NumberGrid.tsx`:
```typescript
import type { AppearanceCount } from '@/types/lotto'

interface NumberGridProps {
  counts: AppearanceCount[]
  highlightTop?: number
  className?: string
}

export default function NumberGrid({
  counts,
  highlightTop = 5,
  className = '',
}: NumberGridProps) {
  const maxWin = Math.max(...counts.map(c => c.winCount), 1)
  const sorted = [...counts].sort((a, b) => a.number - b.number)

  return (
    <div className={`grid grid-cols-9 gap-1 ${className}`}>
      {sorted.map((c, i) => (
        <div
          key={c.number}
          title={`Win: ${c.winCount} | Bonus: ${c.bonusCount}`}
          className={`flex flex-col items-center p-1 rounded text-xs ${
            i < highlightTop ? 'bg-yellow-200 font-bold' : 'bg-gray-100'
          }`}
        >
          <span className="font-bold">{c.number}</span>
          <span className="text-gray-500">{c.winCount}</span>
        </div>
      ))}
    </div>
  )
}
```

Update `lotto-next/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '로또 번호 추천',
  description: '로또 번호 추천 및 당첨 이력 확인 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b px-4 py-3 flex gap-6 text-sm font-medium">
          <a href="/" className="hover:text-yellow-600">번호 추천</a>
          <a href="/history" className="hover:text-yellow-600">당첨 이력</a>
          <a href="/my-numbers" className="hover:text-yellow-600">내 번호 확인</a>
          <a href="/stats" className="hover:text-yellow-600">번호 통계</a>
        </nav>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Run tests — confirm PASS**

```bash
npx jest components/__tests__/
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/ app/layout.tsx app/globals.css
git commit -m "feat: add base UI components (LottoBall, BallSet, NumberGrid) and layout"
```

---

### Task 14: Recommender Page (Home)

**Files:**
- Create: `lotto-next/app/page.tsx`
- Create: `lotto-next/components/RecommenderClient.tsx`

- [ ] **Step 1: Write the client component (user interaction)**

Create `lotto-next/components/RecommenderClient.tsx`:
```typescript
'use client'

import { useState } from 'react'
import BallSet from './BallSet'
import type { RecommendMode } from '@/types/lotto'

export default function RecommenderClient() {
  const [mode, setMode] = useState<RecommendMode>('stats')
  const [numbers, setNumbers] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/recommend?mode=${mode}`)
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
    <div className="space-y-6">
      <div className="flex gap-4">
        {(['stats', 'exception', 'random'] as RecommendMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              mode === m
                ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                : 'border-gray-300 text-gray-600 hover:border-yellow-400'
            }`}
          >
            {m === 'stats' ? '통계 기반' : m === 'exception' ? '제외 기반' : '랜덤'}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? '추첨 중...' : '번호 추천받기'}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {numbers.length > 0 && (
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <BallSet balls={numbers} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the page (Server Component)**

Update `lotto-next/app/page.tsx`:
```typescript
import RecommenderClient from '@/components/RecommenderClient'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎱 번호 추천</h1>
        <p className="text-gray-500 mt-2">당신의 행운의 번호를 뽑아보세요</p>
      </div>
      <RecommenderClient />
    </div>
  )
}
```

- [ ] **Step 3: Visual check in browser**

```bash
npm run dev
```

Open `http://localhost:3000` — see the recommender page. Click "번호 추천받기" → 6 balls appear.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/RecommenderClient.tsx
git commit -m "feat: add recommender home page"
```

---

### Task 15: Draw History Page

**Files:**
- Create: `lotto-next/app/history/page.tsx`
- Create: `lotto-next/components/HistoryClient.tsx`

- [ ] **Step 1: Write client component**

Create `lotto-next/components/HistoryClient.tsx`:
```typescript
'use client'

import { useState } from 'react'
import BallSet from './BallSet'
import type { GameInfo } from '@/types/lotto'

export default function HistoryClient() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [games, setGames] = useState<GameInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ order })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    try {
      const res = await fetch(`/api/history?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGames(data.games)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작 회차</label>
          <input
            type="number" value={from} onChange={e => setFrom(e.target.value)}
            placeholder="예: 1" min={1}
            className="border rounded px-3 py-2 w-28 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료 회차</label>
          <input
            type="number" value={to} onChange={e => setTo(e.target.value)}
            placeholder="예: 100" min={1}
            className="border rounded px-3 py-2 w-28 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">정렬</label>
          <select
            value={order} onChange={e => setOrder(e.target.value as 'ASC' | 'DESC')}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="DESC">최신순</option>
            <option value="ASC">오래된순</option>
          </select>
        </div>
        <button
          onClick={search} disabled={loading}
          className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg disabled:opacity-50"
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {games.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border-b">회차</th>
                <th className="p-3 border-b">날짜</th>
                <th className="p-3 border-b">당첨 번호</th>
                <th className="p-3 border-b text-right">1등 당첨금</th>
                <th className="p-3 border-b text-right">1등 당첨자</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => (
                <tr key={g.gameNo} className="hover:bg-gray-50 border-b">
                  <td className="p-3 font-medium">{g.gameNo}회</td>
                  <td className="p-3 text-gray-500">{g.gameDate}</td>
                  <td className="p-3">
                    <BallSet
                      balls={[g.firstBall, g.secondBall, g.thirdBall, g.fourthBall, g.fifthBall, g.sixthBall]}
                      bonusBall={g.bonusBall}
                    />
                  </td>
                  <td className="p-3 text-right">{g.firstWinnerAmount.toLocaleString()}원</td>
                  <td className="p-3 text-right">{g.firstWinnerCount}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {games.length === 0 && !loading && !error && (
        <p className="text-gray-400 text-center py-8">회차 범위를 입력하고 조회하세요</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the page**

Create `lotto-next/app/history/page.tsx`:
```typescript
import HistoryClient from '@/components/HistoryClient'

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📋 당첨 이력</h1>
        <p className="text-gray-500 mt-2">회차별 당첨 번호를 조회합니다</p>
      </div>
      <HistoryClient />
    </div>
  )
}
```

- [ ] **Step 3: Visual check**

Open `http://localhost:3000/history` — enter a range, click 조회, table of draws appears.

- [ ] **Step 4: Commit**

```bash
git add app/history/ components/HistoryClient.tsx
git commit -m "feat: add draw history page"
```

---

### Task 16: My Numbers Page

**Files:**
- Create: `lotto-next/app/my-numbers/page.tsx`
- Create: `lotto-next/components/MyNumbersClient.tsx`

- [ ] **Step 1: Write client component**

Create `lotto-next/components/MyNumbersClient.tsx`:
```typescript
'use client'

import { useState } from 'react'
import type { MyRankInGame } from '@/types/lotto'

const RANK_LABEL: Record<number, string> = {
  1: '1등 🏆',
  2: '2등 🥈',
  3: '3등 🥉',
  4: '4등',
  5: '5등',
}

export default function MyNumbersClient() {
  const [inputs, setInputs] = useState<string[]>(['', '', '', '', '', ''])
  const [results, setResults] = useState<MyRankInGame[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setInput(i: number, val: string) {
    const next = [...inputs]
    next[i] = val
    setInputs(next)
  }

  async function check() {
    const nums = inputs.map(Number)
    if (nums.some(n => isNaN(n) || n < 1 || n > 45)) {
      setError('1~45 사이의 숫자를 6개 모두 입력하세요')
      return
    }
    if (new Set(nums).size !== 6) {
      setError('중복된 번호가 있습니다')
      return
    }

    setLoading(true)
    setError(null)
    const params = new URLSearchParams(nums.map((n, i) => [`n${i + 1}`, String(n)]))
    try {
      const res = await fetch(`/api/my-numbers?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.results)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        {inputs.map((val, i) => (
          <input
            key={i}
            type="number" min={1} max={45}
            value={val}
            onChange={e => setInput(i, e.target.value)}
            placeholder={String(i + 1)}
            className="border rounded px-3 py-2 w-16 text-center text-sm font-bold"
          />
        ))}
        <button
          onClick={check} disabled={loading}
          className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg disabled:opacity-50"
        >
          {loading ? '확인 중...' : '이력 확인'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {results !== null && (
        <div>
          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">3개 이상 일치한 회차가 없습니다</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 border-b">회차</th>
                  <th className="p-3 border-b">일치 번호 수</th>
                  <th className="p-3 border-b">보너스 일치</th>
                  <th className="p-3 border-b">등수</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.gameNo} className="hover:bg-gray-50 border-b">
                    <td className="p-3 font-medium">{r.gameNo}회</td>
                    <td className="p-3">{r.winNumberCount}개</td>
                    <td className="p-3">{r.bonusNumberCount > 0 ? '일치' : '-'}</td>
                    <td className="p-3 font-bold">{r.rank ? RANK_LABEL[r.rank] : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the page**

Create `lotto-next/app/my-numbers/page.tsx`:
```typescript
import MyNumbersClient from '@/components/MyNumbersClient'

export default function MyNumbersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🔢 내 번호 확인</h1>
        <p className="text-gray-500 mt-2">내 번호가 역대 로또 결과에서 당첨된 적 있는지 확인합니다 (3개 이상 일치)</p>
      </div>
      <MyNumbersClient />
    </div>
  )
}
```

- [ ] **Step 3: Visual check**

Open `http://localhost:3000/my-numbers` — enter 6 numbers, click 이력 확인.

- [ ] **Step 4: Commit**

```bash
git add app/my-numbers/ components/MyNumbersClient.tsx
git commit -m "feat: add my-numbers history page"
```

---

### Task 17: Number Frequency Stats Page

**Files:**
- Create: `lotto-next/app/stats/page.tsx`
- Create: `lotto-next/components/StatsClient.tsx`

- [ ] **Step 1: Write client component**

Create `lotto-next/components/StatsClient.tsx`:
```typescript
'use client'

import { useState, useEffect } from 'react'
import NumberGrid from './NumberGrid'
import type { AppearanceCount, AppearanceSortBy, SortOrder } from '@/types/lotto'

export default function StatsClient() {
  const [sortBy, setSortBy] = useState<AppearanceSortBy>('winCount')
  const [order, setOrder] = useState<SortOrder>('DESC')
  const [stats, setStats] = useState<AppearanceCount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ sortBy, order })
    try {
      const res = await fetch(`/api/stats?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStats(data.stats)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sortBy, order])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">정렬 기준</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as AppearanceSortBy)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="winCount">당첨 번호 출현</option>
            <option value="bonusCount">보너스 번호 출현</option>
            <option value="sumCount">전체 출현</option>
            <option value="number">번호 순</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">정렬 방향</label>
          <select
            value={order}
            onChange={e => setOrder(e.target.value as SortOrder)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="DESC">내림차순</option>
            <option value="ASC">오름차순</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-400">로딩 중...</p>
      ) : (
        <div className="space-y-4">
          <NumberGrid counts={stats} highlightTop={5} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 border-b">번호</th>
                  <th className="p-3 border-b text-right">당첨 출현</th>
                  <th className="p-3 border-b text-right">보너스 출현</th>
                  <th className="p-3 border-b text-right">합계</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => (
                  <tr key={s.number} className="hover:bg-gray-50 border-b">
                    <td className="p-3 font-bold">{s.number}</td>
                    <td className="p-3 text-right">{String(s.winCount)}</td>
                    <td className="p-3 text-right">{String(s.bonusCount)}</td>
                    <td className="p-3 text-right">{String(s.sumCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the page**

Create `lotto-next/app/stats/page.tsx`:
```typescript
import StatsClient from '@/components/StatsClient'

export default function StatsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 번호 통계</h1>
        <p className="text-gray-500 mt-2">1~45 각 번호의 역대 출현 빈도를 확인합니다</p>
      </div>
      <StatsClient />
    </div>
  )
}
```

- [ ] **Step 3: Visual check**

Open `http://localhost:3000/stats` — number grid and table load automatically.

- [ ] **Step 4: Commit**

```bash
git add app/stats/ components/StatsClient.tsx
git commit -m "feat: add number frequency stats page"
```

---

### Task 18: Vercel Deployment

**Files:**
- Modify: `lotto-next/vercel.json` (already created in Task 1 — verify it's correct)
- No new files

- [ ] **Step 1: Verify `vercel.json`**

`lotto-next/vercel.json` should be:
```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 1 * * 0"
    }
  ]
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

```bash
npx jest
```

Expected: all tests PASS.

- [ ] **Step 3: Push to GitHub**

Create a new GitHub repo (e.g. `lotto-next`), then:
```bash
git remote add origin https://github.com/<your-username>/lotto-next.git
git push -u origin main
```

- [ ] **Step 4: Deploy to Vercel**

1. Go to vercel.com → New Project → Import `lotto-next` repo
2. Framework Preset: Next.js (auto-detected)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase dashboard → Project Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase dashboard → Project Settings → API
   - `CRON_SECRET` — generate with `openssl rand -hex 32`
4. Click Deploy

- [ ] **Step 5: Verify Cron Job**

In Vercel dashboard → Project → Cron Jobs — confirm the cron at `/api/sync` is listed with schedule `0 1 * * 0`.

- [ ] **Step 6: Smoke test production**

```bash
curl https://<your-vercel-url>/api/recommend?mode=random
# Expected: {"numbers":[...]}

curl -X POST https://<your-vercel-url>/api/sync \
  -H "Authorization: Bearer <CRON_SECRET>"
# Expected: {"synced": N, ...}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: configure Vercel deployment and cron job"
```

---

### Task 19: Data Migration (MySQL → Supabase)

**Note:** This is a one-time operational task, not code. Run on the machine that has access to the existing MySQL database.

- [ ] **Step 1: Export MySQL data to CSV**

```bash
mysqldump -u <user> -p <database> \
  --tab=/tmp/lotto_export \
  --fields-terminated-by=',' \
  --lines-terminated-by='\n' \
  game_info win_numbers bonus_number
```

Or use Sequel Pro / DBeaver → Export to CSV for each table.

- [ ] **Step 2: Transform CSV if needed**

Check date format in `game_info.game_date` — MySQL stores as `YYYY-MM-DD`, Supabase expects the same. No change needed.

- [ ] **Step 3: Import to Supabase**

In Supabase dashboard → Table Editor → `game_info` → Import Data → upload CSV.
Repeat for `win_numbers` and `bonus_number`.

Or via `psql`:
```bash
psql "postgresql://postgres:<password>@<host>:5432/postgres" \
  -c "\COPY game_info FROM '/tmp/lotto_export/game_info.csv' CSV"
psql "..." -c "\COPY win_numbers FROM '/tmp/lotto_export/win_numbers.csv' CSV"
psql "..." -c "\COPY bonus_number FROM '/tmp/lotto_export/bonus_number.csv' CSV"
```

- [ ] **Step 4: Verify row counts match**

In MySQL:
```sql
SELECT COUNT(*) FROM game_info;
SELECT COUNT(*) FROM win_numbers;
SELECT COUNT(*) FROM bonus_number;
```

In Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM game_info;
SELECT COUNT(*) FROM win_numbers;
SELECT COUNT(*) FROM bonus_number;
```

Counts must match.

- [ ] **Step 5: Run a sync to confirm no-op**

```bash
curl -X POST https://<your-vercel-url>/api/sync \
  -H "Authorization: Bearer <CRON_SECRET>"
# Expected: {"synced": 0, "skipped": 0} — nothing new to import
```

- [ ] **Step 6: Verify UI on production**

Open the deployed Vercel URL → `/stats` page should show all 45 numbers with non-zero counts.
Open `/history?from=1&to=5&order=ASC` → first 5 draws should appear with correct balls.

---

## Self-Review Checklist

- [x] Task 1 scaffolds the project correctly
- [x] Task 2 defines all types used in Tasks 6–17
- [x] Tasks 3–4 cover all DB tables and functions referenced in API routes
- [x] Task 5 produces the `createServerClient` function used by Tasks 8–12
- [x] Task 6 produces `parseLatestGameNo`, `parseGameInfo`, `getLatestGameNo`, `fetchGameInfo` — all used in Task 8
- [x] Task 7 produces `recommendStats`, `recommendException`, `recommendRandom`, `recommendWithExclusions` — all used in Task 9
- [x] Tasks 8–12 cover all 5 API routes from the spec
- [x] Tasks 13–17 cover all 4 UI pages from the spec + shared components
- [x] Task 18 covers Vercel deployment + cron
- [x] Task 19 covers data migration
- [x] `recommendRandomNumbers()` Java method (19M iteration monte carlo) replaced with Fisher-Yates shuffle — explicitly noted in Task 7
- [x] `insertWinnerBalls` MySQL variable trick replaced with JS array insert loop in Task 8
- [x] All type names consistent: `GameInfo`, `AppearanceCount`, `MyRankInGame`, `RecommendMode`, `AppearanceSortBy`, `SortOrder` throughout
- [x] All function names consistent between tasks: `createServerClient`, `getLatestGameNo`, `fetchGameInfo`, `recommendStats`, `recommendException`, `recommendRandom`, `recommendWithExclusions`
