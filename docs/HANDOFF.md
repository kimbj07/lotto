# 행운로또 — Project Handoff / Continue on Another PC

Portable, self-contained guide to pick this project back up on a different machine.
**No secrets are stored here** — only where to obtain each one. Last updated 2026-07-03
(app is live, merged through **PR #25**).

For the full PR-by-PR history see [`docs/superpowers/progress/lotto-nextjs-rewrite-progress.md`](superpowers/progress/lotto-nextjs-rewrite-progress.md)
and `git log` (squash-merge commits are tagged `(#N)`). The spec + plans live under
`docs/superpowers/specs/` and `docs/superpowers/plans/`.

---

## 1. What this is

A Korean lotto helper — Next.js 14 (App Router) + Supabase (Postgres) + Vercel,
rewritten from a legacy Java Spring MVC + iBatis + MySQL app. No auth; fully public.

- **Live:** https://lotto-two-delta.vercel.app
- **Repo:** https://github.com/kimbj07/lotto (GitHub account **kimbj07**), default branch `master`.
- **App code:** `lotto-next/` (the legacy Java project sits beside it under `lotto/`).
- **Sister app:** **멍사주** https://mengsaju.vercel.app (`kimbj07/mengsaju`) — the two
  apps cross-promote each other. See §7.

Pages: `/` (number recommender + include/exclude pickers + draw animation + Kakao share),
`/history`, `/my-numbers`, `/stats`, `/results` (번호 추천 결과). Every page has a footer
멍사주 promo banner.

---

## 2. Set up on a new PC

**Prerequisites:** Node 18+ (or 20+), npm, git, a GitHub account with push access to
`kimbj07/lotto`.

```bash
git clone https://github.com/kimbj07/lotto.git
cd lotto/lotto-next
npm ci
```

**Environment variables** — create `lotto-next/.env.local` (gitignored; never commit it).
Obtain each value from its source; none are stored in the repo:

| Var | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API (server-only, secret) |
| `CRON_SECRET` | The value already set in the Vercel project env (Settings → Environment Variables). It's a `openssl rand -hex 32` string; copy the existing one so local matches prod. |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | developers.kakao.com → app → **JavaScript key** (public; safe client-side). |

The same values are already configured in the **Vercel project env** for production — the
new PC only needs them locally for `npm run dev`/`start`. If you don't have Supabase/Vercel
dashboard access on the new PC, sign in with the same accounts that own those projects.

**Run locally against real Supabase:**
```bash
PORT=3100 npm run dev      # or: npm run start after npm run build
npm test                   # Jest + Testing Library
npm run build              # compile + type-check + lint
```

---

## 3. Daily workflow & operational gotchas (IMPORTANT)

- **git/gh auth:** on the original machine a stale `GITHUB_TOKEN` env var shadows the valid
  credential, so commands were run as `env -u GITHUB_TOKEN git …` / `env -u GITHUB_TOKEN gh …`.
  On a fresh PC this may not be needed — but if git/gh auth fails unexpectedly, check for a
  bogus `GITHUB_TOKEN` in the environment and unset it.
- **Never push to `master`** — it's protected/blocked. Always: branch → PR → squash-merge.
  `gh pr merge <n> --squash`. Deleting the branch via `--delete-branch` can fail if a
  worktree holds it; delete separately: `git push origin --delete <branch>`.
- **`git fetch` before branching.** After a squash-merge the local `origin/master` ref lags;
  branching off a stale ref silently drops the just-merged PR. Fetch, then verify
  `git log --oneline -1 origin/master` shows the latest `(#N)`.
- **Vercel deploys automatically** on merge to `master` (~1 min to a production build). No
  manual deploy step. Preview deploys for non-prod branches are auth-gated (login to view)
  and **share the production Supabase** — seeded/DDL changes there affect prod too.
- **Supabase migrations are DDL** and must be applied **by a human in the Supabase SQL
  editor** (the service_role REST key can't run DDL). Migrations `001–007` are all applied.
  New migrations live in `supabase/migrations/`.

---

## 4. Domain gotchas that cost real debugging time (read before touching these)

- **Kakao share** (`components/KakaoShareButton.tsx`): `Kakao.Share.sendDefault` only works
  from the **domain registered in the Kakao dev console** (Web platform + 카카오톡 공유 enabled),
  so it **cannot be verified on localhost or preview URLs** — only on prod in a real browser.
  Two non-obvious card bugs (the card *looks* fine either way):
  1. **The card link must NOT be a bare domain.** A bare `https://…vercel.app` makes Kakao
     substitute a dead numeric domain-id (`did`) and **tapping the card does nothing**. Use a
     **non-bare** URL (a `?query` or `#fragment` is enough) so Kakao uses the real URL as the
     `did`. That's why the share link is `…/?utm_source=kakao&utm_medium=share`.
  2. **The card `imageUrl` must be a static file with a Content-Length** (`/public/og-image.png`),
     not the dynamic `/opengraph-image` route (chunked → Kakao's scraper drops it → placeholder).
  - KakaoTalk **caches cards by URL** — a previously-shared bad card stays broken until you
    share a fresh/changed URL. Always re-share to re-test.
- **Next.js Data Cache:** `dynamic='force-dynamic'` does NOT stop Next's fetch-level Data
  Cache for supabase-js reads — a param-less read froze at the first post-deploy value (this
  broke `/results`). Fix: `createServerClient` passes `cache:'no-store'` (`lib/supabase.ts`).
- **anon grant scope:** anon can SELECT only the materialized summary tables
  (`recommendation_summary`, `recommendation_mode_summary`); the raw `recommendations` table is
  service_role-only. New per-something aggregations follow the materialized-table pattern,
  rebuilt by `refresh_recommendation_summary()` during `/api/sync`.
- **OG image is statically generated at build time** and reads a vendored font subset
  (`app/fonts/Jua-og.ttf`). Do NOT add `runtime='edge'` (moves the font read to per-request).
- **dhlottery.co.kr was rebuilt in 2026** — legacy endpoints are gone; `lib/lotto-api.ts` uses
  the current `selectMainInfo.do` + `selectPstLt645InfoNew.do` endpoints (IE8 UA required).

---

## 5. Vercel Cron

Sunday 01:00 UTC → `GET /api/sync` (Vercel triggers GET; the route exports GET and POST).
Auth via `CRON_SECRET` (unauth → 401). `/api/sync` grades the new draw and rebuilds the
summary tables, then evicts the in-memory cache (`lib/cache.ts`, 1h TTL) **after** the
rebuild.

---

## 6. State of the data

Production DB is a clean slate — test/sample recommendation data was cleaned up. `/results`
shows the empty state until real recommendations accumulate and the weekly cron grades a new
draw. 1230 draws are seeded (`game_info`, `win_numbers`, `bonus_number`); latest draw 1230
(2026-06-27).

---

## 7. Sister repo: 멍사주 (mengsaju)

`~/workspace/mengsaju` — the owner's other app (`kimbj07/mengsaju`, Vite + React 19 + TS +
Tailwind v4, live at mengsaju.vercel.app, auto-deploys from `main`). The two apps run a
**reciprocal cross-promo**: lotto shows a 멍사주 banner (`components/PromoBanner.tsx`), and
mengsaju shows a 행운로또 banner on every page (mengsaju PR #3). When you change one side's
promo, update the other.

mengsaju operational quirks (differ from this repo):
- **All commands run in Docker:** `docker compose run --rm app <cmd>` (e.g. `npx tsc --noEmit`,
  `npm run build`, `npm test`). Direct `npm run dev|test|install` is forbidden by its repo rules.
- **Its git remote is SSH and SSH auth was broken** on the original machine — push over HTTPS
  instead: `git push https://github.com/kimbj07/mengsaju.git <branch>`. For PRs, its `gh`
  default host is an enterprise host, so target github.com explicitly:
  `GH_HOST=github.com gh pr create --repo kimbj07/mengsaju …`.
- Two page types, both count as "every page": the tabbed **SPA** (`src/App.tsx`, one shared
  shell) and **13 static SEO landing pages** at `public/**/index.html`.

---

## 8. Open ideas / possible next tasks

No hard blockers. Recently shipped: Kakao share (working), lottery-cage draw animation,
reciprocal cross-promo banners. Candidate follow-ups (not committed to):

- Verify Kakao share attribution + cross-promo UTM traffic in Vercel Analytics.
- Consider share-count / lightweight analytics on the recommend flow.
- Revisit the recommend algorithms (stats/exception modes) if win-rate data suggests tuning.

Keep this file current when you finish notable work, alongside the PR changelog in
`docs/superpowers/progress/`.
