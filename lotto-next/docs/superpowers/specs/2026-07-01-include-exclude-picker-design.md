# 번호 포함/제외 추천 (Include/Exclude Picker) — Design

**Date:** 2026-07-01
**Status:** Approved (brainstorming) → ready for implementation plan

## Context

The 번호 추천 page (`/`, `RecommenderClient`) offers three modes (통계 기반 / 제외 기반 / 랜덤) but gives no explanation of what they do, and the user cannot steer the result. Two additions:

1. **Mode descriptions** — a one-line explanation of the selected mode.
2. **Include/exclude number pickers** — the user may optionally pick numbers to
   force-include and numbers to forbid; the recommendation honors both.

**Approved semantics:** include/exclude are **constraints layered on the chosen
mode**. The result ALWAYS contains the included numbers and NEVER the excluded
ones; the remaining `6 − include.length` slots are filled by the selected mode's
own logic, restricted to the allowed pool (falling back to any allowed number if
the mode's soft-exclusions would otherwise leave fewer than 6).

## Dependency / sequencing

This modifies `app/api/recommend/route.ts` and `lib/recommend.ts`, which PR #7
(번추 결과) also changed (recommendation recording). **Implement on a branch off
master AFTER PR #7 is merged**, so the recommend route already contains the
`recordRecommendation` call. The design below assumes that post-PR-#7 state.

## Global Constraints

- Next.js 14 App Router (RSC + `'use client'` split); TypeScript strict; types snake_case.
- Korean UI copy; OMC design system (`.card`, `.btn-gold`, brand/gold tokens, `font-display`, small `LottoBall`s).
- Recommend algorithm output (numbers) always has exactly 6 unique numbers in 1–45.
- Recording (from PR #7) stays: every generation records the actual mode (stats/exception/random).

## Constraints & validation (hard rules)

- **Include:** 0–**5** numbers, each 1–45, unique.
- **Exclude:** 0–**38** numbers, each 1–45, unique.
- Include and exclude must be **disjoint** (a number can be in at most one).
- With exclude ≤ 38, at least 7 numbers remain, so 6 are always pickable.
- API returns **400** on any violation.

## Backend

### `lib/recommend.ts`
Add an optional constraints argument to the three generators. Signature:

```ts
interface RecommendConstraints { include?: number[]; exclude?: number[] }
export function recommendRandom(c?: RecommendConstraints): number[]
export function recommendStats(games: GameInfo[], counts: AppearanceCount[], c?: RecommendConstraints): number[]
export function recommendException(games: GameInfo[], counts: AppearanceCount[], c?: RecommendConstraints): number[]
```

Shared behavior:
- Start `available = ALL_NUMBERS \ exclude`.
- Pre-place `include` into `selected` and remove them from `available`.
- Run the mode's existing pick logic (top-frequency & bonus soft-exclusions, then
  its bottom/mid/N-weeks discretionary picks) **only while `selected.length < 6`**,
  picking from `available`.
- Fill remaining slots (`6 − selected.length`) from `available` (random).
- **Fallback:** if still short (soft-exclusions over-shrank the pool), fill from
  `ALL_NUMBERS \ exclude \ selected` (random) so the result is always 6.
- Return `selected` sorted ascending; throw if not exactly 6 (should be unreachable
  given validation).

`recommendRandom(c)` = includes + random fill from `ALL_NUMBERS \ exclude \ include`.

Remove the now-unused `recommendWithExclusions` (the route no longer bypasses the
mode for exclusions) and its dedicated tests; its behavior is subsumed by the
constrained mode functions.

### `app/api/recommend/route.ts`
- Parse `mode` (stats|exception|random), `include` (csv), `exclude` (csv).
- Validate per the rules above → 400 on violation (invalid range, over-max, overlap).
- Remove the old `if (excludeParam) → recommendWithExclusions` bypass branch.
- Build `constraints = { include, exclude }` and pass to the chosen generator
  (random returns immediately; stats/exception fetch stats first, as today).
- Record the generation (unchanged from PR #7) with the actual `mode`.

## Frontend

### New component `components/SelectableNumberGrid.tsx` (`'use client'` or pure)
A small, selectable 1–45 grid. Props:
```ts
{
  selected: number[]
  onToggle: (n: number) => void
  max: number
  disabled?: number[]   // numbers picked in the OTHER grid — shown dimmed, non-clickable
  accent?: 'brand' | 'red'  // include=brand, exclude=red
}
```
9-column grid of small `LottoBall`s. Selected → ring/filled accent; `disabled` →
dimmed + non-interactive; when `selected.length >= max`, unselected balls are
non-interactive (with a subtle hint). Reuses existing ball styling.

### `components/RecommenderClient.tsx`
- Add `include: number[]` and `exclude: number[]` state.
- Mode selector unchanged; below it render the **mode description** for the
  selected mode (from a `MODE_DESC` map).
- Add a "번호 지정 (선택)" section with two labeled `SelectableNumberGrid`s:
  - **포함할 번호** — `max={5}`, `disabled={exclude}`, accent brand; header `{include.length} / 5`.
  - **제외할 번호** — `max={38}`, `disabled={include}`, accent red; header `{exclude.length} / 38`.
- Toggle handlers enforce max and mutual exclusivity (a number in one grid is
  `disabled` in the other; toggling only adds when under max).
- `generate()` builds the query: `mode`, and `include`/`exclude` (csv) when non-empty.
- Result rendering (BallSet) unchanged.

Mode descriptions:
- stats — "자주 나온 번호와 최근 보너스 번호를 피하고, 저빈도·중간 빈도 번호를 섞어 추천합니다."
- exception — "통계 기반 규칙에 더해 8회차 전 당첨 번호에서 하나를 골라 변화를 줍니다."
- random — "1~45에서 완전 무작위로 6개를 뽑습니다."

## Testing

- **`lib/__tests__/recommend.test.ts`** — for each generator with constraints:
  includes always present, excludes never present, exactly 6 unique numbers, and
  the max-stress case (exclude 38 + include 5) still returns 6. Remove obsolete
  `recommendWithExclusions` tests; keep/adjust the no-constraint tests.
- **`app/api/recommend/__tests__/route.test.ts`** — extend: `include`/`exclude`
  validation 400s (over-max, out-of-range, overlap); constraints reach the
  algorithm (result contains include, excludes absent); recording still fires
  with the real mode. (PR #7's random/custom tests are updated — 'custom' mode is
  gone; the exclusions path now records the actual mode.)
- **`components/__tests__/SelectableNumberGrid.test.tsx`** — toggling selects/
  deselects; at `max`, unselected balls don't toggle; `disabled` numbers don't toggle.
- **`components/__tests__/RecommenderClient.test.tsx`** (new) — selecting include/
  exclude and generating sends the right query params; mode description renders.

## Out of scope (YAGNI)

Persisting the user's include/exclude preferences; weighting includes by
frequency; per-number tooltips; changing the stats algorithm's constants.
