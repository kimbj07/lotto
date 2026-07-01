# 모드별 승률 (Per-Mode Win-Rate Breakdown) — Design

**Date:** 2026-07-01
**Status:** Approved (brainstorming) → implementation

## Context

The 번추 결과 (`/results`) page shows an all-time card + per-round cards, each with
1등~5등 rank chips, aggregated **only by `target_game_no`**. Users can't see which
recommendation mode (통계 기반 / 제외 기반 / 랜덤) actually performs best. This adds an
**all-time per-mode win-rate breakdown**.

**Metric (approved):** for each mode — a headline **win-rate %** plus per-rank detail.
- win-rate % = `(rank1 + rank2 + rank3 + rank4 + rank5) / graded_count` × 100 (share of
  that mode's *graded* picks that won any prize, 1등~5등).
- **Scope: all-time only.** Per-round-per-mode would be tiny samples; win-rate is only
  meaningful at scale.

## Constraint

PR #7 tightened grants so the **anon key can SELECT only `recommendation_summary`**, not
the raw `recommendations` table. The `/results` route uses the anon client, so it cannot
`GROUP BY mode` over the raw table. Chosen approach (A): a **new materialized table**
`recommendation_mode_summary`, rebuilt by the existing cron refresh, readable by anon.

## Data model — migration `007_recommendation_mode_summary.sql`

```sql
CREATE TABLE IF NOT EXISTS recommendation_mode_summary (
  mode          TEXT        PRIMARY KEY,   -- 'stats' | 'exception' | 'random'
  total         INTEGER     NOT NULL DEFAULT 0,
  graded_count  INTEGER     NOT NULL DEFAULT 0,
  rank1..rank5  INTEGER     NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recommendation_mode_summary TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_mode_summary TO service_role;
```

Same shape as `recommendation_summary`, keyed by `mode`.

## Refresh — extend `refresh_recommendation_summary()`

Migration 007 does `CREATE OR REPLACE` of the function so a single call rebuilds **both**
summary tables (carrying over 006's `DELETE … WHERE true` fix verbatim so nothing
regresses). Appended to the existing body:

```sql
DELETE FROM recommendation_mode_summary WHERE true;
INSERT INTO recommendation_mode_summary
  (mode, total, graded_count, rank1, rank2, rank3, rank4, rank5, updated_at)
SELECT mode, count(*)::int, count(*) FILTER (WHERE graded)::int,
       count(*) FILTER (WHERE rank = 1)::int, … , now()
FROM recommendations GROUP BY mode;
```

No cron code change — `/api/sync` already calls this function when `synced > 0`.

## API — `app/api/recommendations/summary/route.ts`

After the existing `recommendation_summary` read, also `SELECT * FROM
recommendation_mode_summary` and return it as `byMode`. **Graceful degradation:** if that
query errors (table not yet migrated), return `byMode: []` and still serve `allTime` +
`rounds` — so deploying before migration 007 never breaks `/results`.

Response: `{ allTime, rounds, byMode: RecommendationModeSummary[] }`.

## Types — `types/lotto.ts`

```ts
export interface RecommendationModeSummary {
  mode: string
  total: number
  graded_count: number
  rank1: number; rank2: number; rank3: number; rank4: number; rank5: number
}
// RecommendationSummary gains: byMode: RecommendationModeSummary[]
```

## UI — `components/ResultsClient.tsx`

A new **"모드별 승률"** section rendered below the 전체 누적 card and above the per-round
list (only when the page has data — the empty-state early return is unchanged). One card
per mode in fixed order 통계 기반 / 제외 기반 / 랜덤:

- Big **win-rate %** (e.g. `2.4%`), computed client-side.
- Subtext `{wins} / {graded_count} 당첨`.
- Existing `RankChips` for the per-rank detail.
- `graded_count === 0` (but total > 0) → show `집계 예정`, no %.
- `total === 0` (mode has no picks yet) → show `아직 번추 없음`.

The client reads `data.byMode ?? []` and looks up each of the three known modes by key, so
missing modes render the `아직 번추 없음` state and the layout is stable. Client defaults
guard against older responses lacking `byMode`.

## Testing

- **`app/api/recommendations/summary/__tests__/route.test.ts`** — the `createServerClient`
  mock now serves two `from()` calls (summary via `.order`, mode-summary via `.select`).
  Add: `byMode` returned from the mode table; graceful `byMode: []` when the mode query
  errors.
- **`components/__tests__/ResultsClient.test.tsx`** — add `byMode` to the fixture; assert
  the 모드별 승률 section renders, the win-rate % is computed correctly, the `집계 예정`
  (0 graded) and `아직 번추 없음` (0 total) states show. Existing tests get `byMode: []`.

## Rollout

Migration 007 applied by the user (DDL, dashboard). Route degrades gracefully until then;
a refresh (weekly cron or manual `POST /api/sync`) populates the table. Preview
deployments share the same Supabase project, so the section shows `아직 번추 없음` until
007 is applied + data is graded.

## Out of scope (YAGNI)

Per-round-per-mode breakdown; time-series/trend of win-rate; statistical
significance/confidence; changing how modes are graded.
