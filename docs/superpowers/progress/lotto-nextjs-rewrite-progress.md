# Lotto Next.js Rewrite — Progress Tracker

**Plan:** `docs/superpowers/plans/2026-06-29-lotto-nextjs-rewrite.md`
**Spec:** `docs/superpowers/specs/2026-06-29-lotto-nextjs-rewrite-design.md`
**Started:** 2026-06-29
**Status:** Planning complete, implementation not started

---

## Task Status

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Project Bootstrap | ⬜ pending | |
| 2 | Shared TypeScript Types | ⬜ pending | |
| 3 | Supabase Schema (Tables) | ⬜ pending | Requires Supabase project created |
| 4 | Supabase PostgreSQL Functions | ⬜ pending | Depends on Task 3 |
| 5 | Supabase Client | ⬜ pending | Depends on Task 3 |
| 6 | Lotto Official API Client | ⬜ pending | Can parallel with Task 7 after Task 2 |
| 7 | Recommendation Logic | ⬜ pending | Can parallel with Task 6 after Task 2 |
| 8 | API Route — Sync | ⬜ pending | Depends on Tasks 5, 6 |
| 9 | API Route — Recommend | ⬜ pending | Depends on Tasks 5, 7 |
| 10 | API Route — History | ⬜ pending | Depends on Task 5 |
| 11 | API Route — My Numbers | ⬜ pending | Depends on Task 5 |
| 12 | API Route — Stats | ⬜ pending | Depends on Task 5 |
| 13 | Base UI Components + Layout | ⬜ pending | Depends on Task 2 |
| 14 | Recommender Page | ⬜ pending | Depends on Task 13 |
| 15 | Draw History Page | ⬜ pending | Depends on Task 13 |
| 16 | My Numbers Page | ⬜ pending | Depends on Task 13 |
| 17 | Stats Page | ⬜ pending | Depends on Task 13 |
| 18 | Vercel Deployment | ⬜ pending | Depends on all prior tasks |
| 19 | Data Migration | ⬜ pending | One-time ops task |

## Status Legend
- ⬜ pending
- 🔄 in progress
- ✅ complete
- ❌ blocked

---

## Key Decisions Made

- **Framework:** Next.js 14 App Router (NOT Pages Router)
- **DB:** Supabase (PostgreSQL) replacing MySQL + iBatis
- **Deployment:** Vercel with Cron Job for weekly sync
- **Auth:** None — fully public
- **UI Theme:** Fun/playful — OMC designer owns styling
- **`recommendRandomNumbers` Java method:** Replaced with Fisher-Yates shuffle (original was 19M iterations, impractical for serverless)
- **Complex SQL queries:** Moved to PostgreSQL functions (`get_game_info_in_range`, `get_appearance_count`), called via `supabase.rpc()`

---

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=      # from Supabase dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY= # from Supabase dashboard → Project Settings → API
CRON_SECRET=                   # generate: openssl rand -hex 32
```

---

## Session Handoff Notes

To resume in a new session:
1. Read this file first: `docs/superpowers/progress/lotto-nextjs-rewrite-progress.md`
2. Read the spec: `docs/superpowers/specs/2026-06-29-lotto-nextjs-rewrite-design.md`
3. Read the plan: `docs/superpowers/plans/2026-06-29-lotto-nextjs-rewrite.md`
4. Find the first task with status ⬜ or 🔄 and continue from there
5. Update this file's task table as tasks complete

---

## Blockers / Open Questions

_None at this time._
