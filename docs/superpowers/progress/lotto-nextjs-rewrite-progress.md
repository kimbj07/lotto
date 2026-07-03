# Lotto Next.js Rewrite — Progress Tracker

**Plan:** `docs/superpowers/plans/2026-06-29-lotto-nextjs-rewrite.md`
**Spec:** `docs/superpowers/specs/2026-06-29-lotto-nextjs-rewrite-design.md`
**Started:** 2026-06-29
**Status:** ✅ **LIVE IN PRODUCTION** — https://lotto-two-delta.vercel.app (current through PR #17, 2026-07-03)

---

## Initial Build (Tasks 1–19) — all complete

| # | Task | Status |
|---|------|--------|
| 1 | Project Bootstrap | ✅ complete |
| 2 | Shared TypeScript Types | ✅ complete |
| 3 | Supabase Schema (Tables) | ✅ complete |
| 4 | Supabase PostgreSQL Functions | ✅ complete |
| 5 | Supabase Client | ✅ complete |
| 6 | Lotto Official API Client | ✅ complete |
| 7 | Recommendation Logic | ✅ complete |
| 8 | API Route — Sync | ✅ complete |
| 9 | API Route — Recommend | ✅ complete |
| 10 | API Route — History | ✅ complete |
| 11 | API Route — My Numbers | ✅ complete |
| 12 | API Route — Stats | ✅ complete |
| 13 | Base UI Components + Layout | ✅ complete |
| 14 | Recommender Page | ✅ complete |
| 15 | Draw History Page | ✅ complete |
| 16 | My Numbers Page | ✅ complete |
| 17 | Stats Page | ✅ complete |
| 18 | Vercel Deployment | ✅ complete |
| 19 | Data Migration | ✅ complete (1230 draws seeded) |

## Status Legend
⬜ pending · 🔄 in progress · ✅ complete · ❌ blocked

---

## Post-launch changelog (merged PRs)

Feature work after the initial launch. Squash-merge commits are tagged `(#N)` in `git log`.

- **#4** Bounded the history default fetch; `next/link` NavBar.
- **#5** In-memory TTL cache for history "latest N" (`lib/cache.ts`, 1h TTL, cron eviction; best-effort per warm instance).
- **#6** Vercel Web Analytics + Speed Insights deps. Web Analytics ON; `<SpeedInsights />` is mounted but its Vercel dashboard toggle is left OFF (Hobby allows it on only 1 project).
- **#7** 번호 추천 결과 (`/results`): records every recommendation, grades it against the draw, materializes `recommendation_summary` (per round).
- **#8** 번호 포함/제외 picker + mode descriptions on `/`: include ≤5, exclude ≤38, layered as constraints on any mode; 400 on violation.
- **#9 / #10** Fixed `/results` serving stale data — Next's fetch **Data Cache** (not the CDN) froze param-less supabase-js reads. Fix: `createServerClient` passes `cache:'no-store'`.
- **#11** 모드별 승률: all-time per-mode win-rate breakdown, materialized `recommendation_mode_summary`.
- **#12** Made the include/exclude pickers collapsible (`FoldSection`, collapsed by default).
- **#13** Renamed 번추 → 번호 추천 throughout; sped up the summary API (`Promise.all` + cached response body via `lib/cache.ts`) — warm loads ~2s → ~0.3–0.5s.
- **#14** SEO: `app/sitemap.ts` (/sitemap.xml), `app/robots.ts` (/robots.txt), Google + Naver site-verification meta via `metadata.verification`.
- **#15** Code-review fixes: `/api/sync` now `clearCache()`s AFTER the grade+refresh RPCs (was evicting before tables were fresh); empty-cache guard on the summary route.
- **#16** OG/social tags + branded OG image + footer promo banner. `lib/siteConfig.ts` centralizes site URL/name/description. `app/opengraph-image.tsx` = next/og 1200×630 branded image. `components/PromoBanner.tsx` = footer cross-promo card (멍사주, mengsaju.vercel.app; `target=_blank rel=noopener`).
- **#17** Review follow-up: vendored the OG font locally (`app/fonts/Jua-og.ttf`, ~14KB Jua OFL subset, read via `readFile`) to drop the OG image's build-time Google-Fonts dependency; removed the global `openGraph.url` (it made every sub-page emit the homepage as its `og:url`).
- **#19** KakaoTalk share button on `/` after a recommendation (`components/KakaoShareButton.tsx`). Shares the site (inviting message + branded OG image), not the drawn numbers. Loads the Kakao JS SDK (pinned `2.7.5` + SRI) only when `NEXT_PUBLIC_KAKAO_JS_KEY` is set; `Kakao.Share.sendDefault` feed template; degrades to copy-link when unavailable. Note: the live send only works from the Kakao-console-registered domain, so it's verified in prod, not locally.
- **#22** Kakao card image: switched `imageUrl` to a **static** `/public/og-image.png` (Content-Length present) instead of the dynamic `/opengraph-image` route (chunked, no Content-Length), which Kakao's scraper silently drops → default-placeholder card. (#21 tried `sendScrap(requestUrl)` and was reverted — Kakao returned "잘못된 요청".)
- **#23** **Kakao dead-link fix (confirmed working on-phone).** Tapping the shared card did nothing. Root cause (found by decoding both apps' Kakao picker preview payloads): a **bare-domain** card link (`…vercel.app`) makes Kakao assign a numeric domain-id (`did: 3139`) that resolves to nothing. Fix: point the card + button links at a **non-bare** URL — `…/?utm_source=kakao&utm_medium=share` — so Kakao uses the real URL as the `did`. Query also doubles as share attribution. (Mengsaju avoided this all along via a URL fragment.) Caveat: KakaoTalk caches cards by URL, so a previously-shared bare-domain card stays dead until re-shared.

---

## Pages / API routes

Pages: `/` (Recommender + include/exclude pickers + KakaoTalk share button after a recommendation), `/history`, `/my-numbers`, `/stats`, `/results` (번호 추천 결과). Every page shows a footer `<PromoBanner />`.
API: `/api/sync`, `/api/recommend`, `/api/history`, `/api/my-numbers`, `/api/stats`, `/api/recommendations/summary`.
Metadata routes: `/sitemap.xml`, `/robots.txt`, `/opengraph-image` (statically generated PNG), `/icon.svg`, `/apple-icon`.

---

## Key Decisions Made

- **Framework:** Next.js 14 App Router (NOT Pages Router). RSC + `'use client'` split (`app/X/page.tsx` wrapper; `components/XClient.tsx`).
- **DB:** Supabase (PostgreSQL) replacing MySQL + iBatis. Complex queries → PostgreSQL functions called via `supabase.rpc()`.
- **Deployment:** Vercel (Hobby), auto-deploy from `master`; Vercel Cron Sunday 01:00 UTC → `/api/sync`.
- **Auth:** None — fully public. anon/authenticated can SELECT only the summary tables; raw `recommendations` is service_role-only, so per-* aggregations use materialized summary tables.
- **UI Theme:** Fun/playful (emerald + gold, Jua display font, 4-leaf clover mark).
- **`recommendRandomNumbers`:** Fisher-Yates shuffle (original Java was 19M iterations, impractical for serverless).
- **OG image:** statically generated at build time (immutable PNG); reads a vendored font subset (do **not** switch it to `runtime='edge'`, which would move the font read to per-request).

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=      # Supabase dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase dashboard → Project Settings → API
SUPABASE_SERVICE_ROLE_KEY=     # Supabase dashboard → Project Settings → API (server-only)
CRON_SECRET=                   # generate: openssl rand -hex 32
NEXT_PUBLIC_KAKAO_JS_KEY=      # developers.kakao.com → app → JavaScript key (public; register the site domain + enable 카카오톡 공유)
```

Stored in `.env.local` (gitignored) for local dev; set in Vercel project env for prod. Never commit real values.

---

## Migrations

`supabase/migrations/` 001–007 — all applied. DDL is applied by a human in the Supabase SQL editor (the service_role REST key can't run DDL). 006 fixes an unqualified `DELETE` (Supabase runs API roles with `sql_safe_updates` on → use `DELETE … WHERE true`); 007 adds `recommendation_mode_summary` and rebuilds `refresh_recommendation_summary()` to refresh both summary tables.

---

## Session Handoff Notes

To resume in a new session:
1. Read this file, then the spec and plan (paths at top).
2. The app is live; use `git log` (PRs tagged `(#N)`) for the latest state.
3. Work on a branch → PR → squash-merge (direct pushes to `master` are blocked). `git fetch` before branching so you don't branch off a stale `origin/master`.
4. Update this changelog when you merge a notable PR.

---

## Blockers / Open Questions

_None at this time._
