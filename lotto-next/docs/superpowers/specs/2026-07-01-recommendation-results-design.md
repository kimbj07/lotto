# 번추 결과 (Recommendation Results) — Design

**Date:** 2026-07-01
**Status:** Approved (brainstorming) → ready for implementation plan

## Context

The app recommends lotto numbers (`/`, `RecommenderClient` → `GET /api/recommend`)
but keeps no record of what it recommended, so it can never show how those picks
performed. This feature adds a **번추 결과** page that:

1. Records every recommendation the app generates, tagged with the draw round it
   is "for" (the next upcoming draw).
2. Grades each recommendation against that round's real winning numbers once the
   draw is available.
3. Shows an **all-time aggregate** plus **per-round breakdowns** by prize rank
   (1등~5등).

Two user decisions shape the design:
- **Track real recommendations** (not a backtest, not a mock). Consequence: the
  page is empty until recommendations are generated and the next draw is synced.
- **Collect the summary during the cron job.** The per-round aggregate is
  materialized into its own table by the weekly sync (which is also when grading
  happens), so the page reads a pre-computed table rather than aggregating live.

## Global Constraints

- Next.js 14 App Router (RSC + `'use client'` split); TypeScript strict; types snake_case.
- Supabase Postgres via `supabase.rpc()` / table selects. Public reads use the anon
  key (read-only); all writes go through `createAdminClient()` (service_role) —
  never the anon key. New tables follow the `004_grants.sql` least-privilege pattern.
- Korean UI copy; OMC design language (`.card`, brand/gold tokens, ball/chip styles).
- Prize-rank rule is the single source of truth in `lib/rank.ts` (extracted from the
  existing `computeRank` in `app/api/my-numbers/route.ts`): 6→1, 5+bonus→2, 5→3,
  4→4, 3→5, else null.

## Data Model — two new tables (migration `005_recommendations.sql`)

### `recommendations` (raw picks)
| column | type | notes |
|---|---|---|
| `id` | bigserial PK | |
| `target_game_no` | integer NOT NULL | round it's "for" = latest synced round + 1 at generation time |
| `mode` | text NOT NULL | `stats` \| `exception` \| `random` \| `custom` (user exclusions) |
| `numbers` | integer[] NOT NULL | the 6 recommended numbers; `CHECK (array_length(numbers,1) = 6)` |
| `rank` | smallint NULL | 1–5 when graded and won; NULL = no prize |
| `graded` | boolean NOT NULL DEFAULT false | distinguishes "not drawn yet" from "graded, no prize" |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |

Index: `(target_game_no)` for grading + summary refresh.

### `recommendation_summary` (materialized per-round aggregate)
| column | type | notes |
|---|---|---|
| `target_game_no` | integer PK | one row per round that has recommendations |
| `total` | integer NOT NULL | total sets recorded for the round |
| `graded_count` | integer NOT NULL | how many have been graded |
| `rank1`…`rank5` | integer NOT NULL DEFAULT 0 | count at each prize rank |
| `updated_at` | timestamptz NOT NULL DEFAULT now() | last cron refresh |

All-time totals are derived by summing `recommendation_summary` rows in the read
route (few rows; no separate table/row needed).

**Grants:** `anon`/`authenticated` → SELECT on both tables; `service_role` →
SELECT/INSERT/UPDATE/DELETE. EXECUTE on the two functions below for all roles.

## Functions (in `005_recommendations.sql`)

- `grade_recommendations(p_game_no integer)` — set-updates every ungraded row with
  `target_game_no = p_game_no`: counts matches against `win_numbers` and
  `bonus_number` for that round, applies the rank rule, sets `rank` + `graded=true`.
- `refresh_recommendation_summary()` — upserts `recommendation_summary` from
  `recommendations` grouped by `target_game_no` (total, graded_count, rank1…rank5,
  updated_at = now()). Full rebuild; the table is tiny.

## Write Path — record on every generation

`app/api/recommend/route.ts` produces one set per call. After computing `numbers`,
it records the pick via `createAdminClient()` (anon is read-only): insert
`{ target_game_no: latest + 1, mode, numbers }`. Applied on every return path
(stats / exception / random / custom-exclusions). `latest` = max `game_no` in
`game_info`; a lightweight single-row lookup is added to the paths that don't
already have it (random / exclusions). One indexed lookup + one insert per call.

`mode` stored: the effective mode — `random` for random rolls, `custom` for the
user-exclusions path, otherwise the `mode` query param (`stats`/`exception`).

## Grading + Summary Collection — in the cron

`app/api/sync/route.ts`, after it inserts a new draw's rows for round N (inside the
existing loop, on success), calls `grade_recommendations(N)`. After the loop, if
anything was synced it calls `refresh_recommendation_summary()` once. Result: on
every weekly cron (and any manual `POST /api/sync`), newly-drawn rounds get graded
and the summary table is rebuilt. This is the only place the summary is collected.

## Read Path + Page

- `app/api/recommendations/summary/route.ts` (anon read): `select * from
  recommendation_summary order by target_game_no desc`, returns
  `{ allTime: { total, graded_count, rank1..rank5 }, rounds: [ ...summary rows ] }`
  (allTime summed in the route).
- `app/results/page.tsx` (RSC): `PageHero` + `ResultsClient`.
- `components/ResultsClient.tsx` (`'use client'`): fetches the summary; renders
  1. **all-time aggregate card** (전체 누적 — total 번추 + 1등~5등, 1등 gold-accented);
  2. **per-round cards**, most recent first: `N회차`, total 번추, 1등~5등 chips.
     A round with `graded_count < total` (not fully drawn) shows a "집계 예정"
     pending badge.
  3. **empty state** when there are no summary rows yet.
- `components/NavBar.tsx`: add `{ href: '/results', label: '번추 결과' }` (5th item;
  nav already scrolls horizontally).

## Caching

None. `recommendation_summary` is a tiny table refreshed only at cron; a live
`select` is cheap. (It would be compatible with the existing `lib/cache` +
cron-eviction if ever needed, but that's out of scope.)

## Types (`types/lotto.ts`)

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

## Testing

- `lib/rank.ts` — unit tests for all boundaries (6→1, 5+bonus→2, 5→3, 4→4, 3→5,
  ≤2→null); `my-numbers` route refactored to import it (behavior unchanged).
- `app/api/recommend/__tests__/route.test.ts` — extend: asserts a record is
  inserted with `{ target_game_no: latest+1, mode, numbers }` for each path
  (mocked admin client), and that a failed insert does not break the response.
- `app/api/recommendations/summary/__tests__/route.test.ts` — shapes `allTime`
  (summed) + `rounds` (ordered) from mocked summary rows; empty case.
- `app/api/sync/__tests__/route.test.ts` — extend: `grade_recommendations` called
  per synced round and `refresh_recommendation_summary` called once when
  `synced > 0`, neither when nothing synced.
- Grading SQL + summary refresh verified via a local end-to-end run against the DB
  (insert sample recommendations for a past round, run sync/grade, read summary).

## Cold-start / rollout

- The page is empty until recommendations exist and a draw is synced. A friendly
  empty state covers this.
- After deploy, running `refresh_recommendation_summary()` (via a manual
  `POST /api/sync`) surfaces any already-recorded rounds without waiting for the
  weekly cron.
- Migration `005` must be applied to Supabase (prod) as part of rollout — like the
  earlier migrations, this is a manual dashboard step.

## Out of scope (YAGNI)

Per-user identity/auth on recommendations; editing/deleting picks; a demo/backtest
seed; charts; caching.
