# Lotto Service — Next.js + Supabase + Vercel Rewrite

**Date:** 2026-06-29  
**Status:** Approved  
**Author:** Tigger Kim

---

## 1. Goals

- Deploy the lotto service to **Vercel** (currently a Java Spring MVC WAR — not deployable to Vercel as-is)
- Migrate the database from **MySQL + iBatis** to **Supabase (PostgreSQL)**
- Add a **React UI** (fun/playful theme, styled by OMC designer) to complement the existing API logic
- Preserve all existing business logic: number recommendation, draw history, frequency stats, my-numbers history
- Replace the scheduled sync job with a **Vercel Cron Job**

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | First-class Vercel support, RSC for data co-location |
| Language | TypeScript | Type safety across DB → API → UI |
| Database | Supabase (PostgreSQL) | Managed Postgres, JS client, good Vercel integration |
| DB Client | `@supabase/supabase-js` | Typed results, RPC for complex queries |
| Styling | Tailwind CSS | Utility-first, easy for designer handoff |
| Deployment | Vercel | Hosting + Cron Jobs |
| UI Theme | Fun/playful — OMC designer | Designer owns component styling |

---

## 3. Project Structure

```
lotto-next/                         ← new Next.js project (separate repo or subdir)
├── app/
│   ├── page.tsx                    # Home → Number Recommender
│   ├── history/
│   │   └── page.tsx                # Draw History
│   ├── my-numbers/
│   │   └── page.tsx                # My Numbers History
│   ├── stats/
│   │   └── page.tsx                # Number Frequency Stats
│   └── api/
│       ├── sync/
│       │   └── route.ts            # POST /api/sync (Vercel Cron target)
│       ├── recommend/
│       │   └── route.ts            # GET /api/recommend?mode=stats|exception|random
│       ├── history/
│       │   └── route.ts            # GET /api/history?from=&to=&order=ASC|DESC
│       ├── my-numbers/
│       │   └── route.ts            # GET /api/my-numbers?n1=..&n6=..
│       └── stats/
│           └── route.ts            # GET /api/stats?from=&to=&sortBy=&order=&count=
├── lib/
│   ├── supabase.ts                 # Supabase client (server + browser singletons)
│   ├── lotto-api.ts                # Fetch from official lotto API (port of LottoApiRequestHelper + LottoURL)
│   └── recommend.ts                # Recommendation logic (port of LottoRandomMachine + LottoBO)
├── components/                     # Designer-owned UI components
│   ├── LottoBall.tsx               # Single numbered ball
│   ├── BallSet.tsx                 # Row of 6 balls + bonus
│   ├── NumberGrid.tsx              # 1–45 grid for frequency stats
│   └── ...
├── vercel.json                     # Cron schedule definition
└── supabase/
    └── migrations/
        ├── 001_schema.sql          # Tables
        └── 002_functions.sql       # PostgreSQL functions for complex queries
```

---

## 4. Database Schema

### Tables

```sql
-- Draw results and prize info per game
CREATE TABLE game_info (
  game_no                     INT PRIMARY KEY,
  game_date                   DATE NOT NULL,
  first_winner_amount         BIGINT,
  first_winner_count          INT,
  total_first_winner_amount   BIGINT,
  second_winner_amount        BIGINT,
  second_winner_count         INT,
  total_second_winner_amount  BIGINT,
  third_winner_amount         BIGINT,
  third_winner_count          INT,
  total_third_winner_amount   BIGINT,
  fourth_winner_amount        BIGINT,
  fourth_winner_count         INT,
  total_fourth_winner_amount  BIGINT,
  fifth_winner_amount         BIGINT,
  fifth_winner_count          INT,
  total_fifth_winner_amount   BIGINT,
  total_winner_count          INT,
  total_amount                BIGINT,
  total_sell_amount           BIGINT,
  manual_winner_count         INT,
  auto_winner_count           INT
);

-- 6 winning balls per draw (sequence 1–6)
CREATE TABLE win_numbers (
  game_no   INT NOT NULL REFERENCES game_info(game_no),
  number    INT NOT NULL,
  sequence  INT NOT NULL,
  PRIMARY KEY (game_no, sequence)
);

-- 1 bonus ball per draw
CREATE TABLE bonus_number (
  game_no  INT PRIMARY KEY REFERENCES game_info(game_no),
  number   INT NOT NULL
);

-- Reference: numbers 1–45
CREATE TABLE number_info (
  number INT PRIMARY KEY
);
-- Seed: INSERT INTO number_info SELECT generate_series(1, 45);
```

### PostgreSQL Functions (called via `supabase.rpc()`)

**`get_game_info_in_range(p_from, p_to, p_order)`** — pivots `win_numbers` rows into columns (firstBall–sixthBall), joins with `bonus_number` and `game_info`. Equivalent to `selectGameInfoInRange` in `sqlmap-lotto.xml`.

**`get_appearance_count(p_from, p_to, p_sort_by, p_sort_order, p_count)`** — counts win + bonus appearances per number across the requested game range, with dynamic sort and optional limit. Equivalent to `selectAppearanceCount`.

Simple queries (`MAX(game_no)`, `IN (list)` checks, inserts) are run directly via the Supabase JS client without RPC.

---

## 5. API Routes

| Method | Route | Handler | Notes |
|---|---|---|---|
| `POST` | `/api/sync` | Fetch latest game no from official API, compare with `MAX(game_no)` in DB, insert missing games | Also the Vercel Cron target |
| `GET` | `/api/recommend` | `?mode=stats\|exception\|random&exclude=1,2,3` | `stats` → stats-based (`recommendNumbers`); `exception` → excludes recent draws' numbers (`recommendExceptionNumbers`); `random` → pure random; optional `exclude` param passes user-supplied numbers to exclude (`recommendNumbersWithoutExceptionNumbers`) |
| `GET` | `/api/history` | `?from=&to=&order=ASC\|DESC` | Calls `get_game_info_in_range` RPC |
| `GET` | `/api/my-numbers` | `?n1=&n2=&n3=&n4=&n5=&n6=` | Validates 6 numbers (1–45, unique), queries match history |
| `GET` | `/api/stats` | `?from=&to=&sortBy=winCount\|bonusCount\|sumCount\|number&order=ASC\|DESC&count=` | Calls `get_appearance_count` RPC |

All routes return JSON. Input validation rejects bad parameters with `400`.

---

## 6. UI Pages

| Page | Route | Description |
|---|---|---|
| Number Recommender | `/` | Select mode (stats-based / exclusion / random), click generate, display 6 numbered balls |
| Draw History | `/history` | Input from/to game number, paginated table of past draws with balls + prize info |
| My Numbers | `/my-numbers` | Enter 6 numbers (1–45), show list of draws where 3+ matched, with rank |
| Frequency Stats | `/stats` | Visual grid or bar showing each number's win count, bonus count, total — sortable |

Pages are **React Server Components** for initial data load (no loading spinner on first paint). Client components handle user interactions (number entry, mode selection, sort toggles).

Designer owns `components/` — pages pass typed props, designer controls all visual styling. No design decisions are hard-coded in page logic.

---

## 7. Vercel Cron Job

`vercel.json`:
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
Runs every Sunday at 01:00 UTC (10:00 KST), the morning after Saturday's draw. The route is also callable manually (POST with no auth required — it is idempotent).

---

## 8. Data Migration

The existing MySQL data needs to be migrated to Supabase before go-live:

1. Export MySQL tables to CSV (`mysqldump --tab` or Sequel Pro export)
2. Import into Supabase via the dashboard or `psql COPY`
3. Verify `MAX(game_no)` matches between old and new DB
4. Re-seed `number_info` (1–45) if not already present in MySQL

No code change required — this is a one-time ops step.

---

## 9. Business Logic Ports

| Java class | TypeScript target | Notes |
|---|---|---|
| `LottoApiRequestHelper` + `LottoURL` | `lib/lotto-api.ts` | `fetch()` replaces Apache HttpClient |
| `LottoRandomMachine` | `lib/recommend.ts` | Pure function, no framework dependency |
| `LottoBO.recommendNumbers()` etc. | `lib/recommend.ts` | Calls Supabase, then passes to recommend logic |
| `GameInfoConvert` | inline in `lib/lotto-api.ts` | JSON → typed object mapping |
| `SaveLatestLottoInfoJob` | `app/api/sync/route.ts` | Logic is simple enough to inline |

---

## 10. Out of Scope

- Authentication / user accounts (app is fully public)
- Admin UI for triggering sync (Cron + manual POST covers it)
- `instame2` / statistics modules from the old repo (lotto-only rewrite)
- Data Sync admin page in UI
