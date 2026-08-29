'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import BallSet from './BallSet'
import DrawAnimation from './DrawAnimation'
import SelectableNumberGrid from './SelectableNumberGrid'
import KakaoShareButton from './KakaoShareButton'
import type { RecommendMode } from '@/types/lotto'
import { MODE_CONFIGS, modeConfig, gameLabel } from '@/lib/recommendModes'
import { fetchJson, FETCH_FALLBACK_MESSAGE } from '@/lib/fetchJson'

// Minimum time the draw cage spins, so a fast fetch still shows a full draw
// instead of a flash. A slow fetch just spins longer.
const MIN_SPIN_MS = 800

type Phase = 'idle' | 'drawing' | 'result'

const pct = (v: number) => `${v.toFixed(1)}%`

function FoldSection({
  testId, label, count, max, open, onToggle, children,
}: {
  testId: string
  label: string
  count: number
  max: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div data-testid={testId} className="rounded-2xl border border-black/5 bg-white/50">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-medium text-gray-600">
          {label}
          {count > 0 && (
            <span className="ml-2 text-xs font-display text-brand-dark">{count}개 선택됨</span>
          )}
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-400">
          {count} / {max}
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export default function RecommenderClient() {
  const [mode, setMode] = useState<RecommendMode>('stats')
  const [include, setInclude] = useState<number[]>([])
  const [exclude, setExclude] = useState<number[]>([])
  // Every mode returns `games: number[][]`; single-game modes have one entry.
  const [games, setGames] = useState<number[][]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [includeOpen, setIncludeOpen] = useState(false)
  const [excludeOpen, setExcludeOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // Honor the OS "reduce motion" setting: skip the spin + tumble when set.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const cfg = modeConfig(mode)
  const isSlip = cfg.games > 1
  const drawing = phase === 'drawing'

  function toggle(list: number[], set: (v: number[]) => void, max: number, n: number) {
    if (list.includes(n)) set(list.filter(x => x !== n))
    else if (list.length < max) set([...list, n])
  }

  function selectMode(next: RecommendMode) {
    // Tabs are disabled while drawing, so no request can be superseded.
    if (next === mode || drawing) return
    const nextCfg = modeConfig(next)
    setMode(next)
    setNotice(null)
    // A tighter exclude cap (target5 needs 30 free numbers) may force us to
    // drop picks. Say which ones — the grid is sorted, click order isn't.
    if (exclude.length > nextCfg.maxExclude) {
      const dropped = exclude.slice(nextCfg.maxExclude).sort((a, b) => a - b)
      setExclude(exclude.slice(0, nextCfg.maxExclude))
      setExcludeOpen(true)
      const what = dropped.length <= 4 ? `${dropped.join('·')}번을` : `${dropped.length}개를`
      setNotice(`제외 번호는 ${nextCfg.maxExclude}개까지라 ${what} 해제했어요.`)
    }
    // A result from another mode has a different shape; clear it.
    setPhase('idle')
    setError(null)
  }

  async function generate() {
    setError(null)
    setNotice(null)
    setPhase('drawing')
    const minSpin = new Promise<void>((r) => setTimeout(r, reduceMotion ? 0 : MIN_SPIN_MS))
    try {
      const params = new URLSearchParams({ mode })
      if (include.length) params.set('include', include.join(','))
      if (exclude.length) params.set('exclude', exclude.join(','))
      // Fetch and the minimum spin run together; reveal once both are done.
      const [data] = await Promise.all([
        fetchJson<{ games: number[][] }>(`/api/recommend?${params}`),
        minSpin,
      ])
      if (!Array.isArray(data.games)) throw new Error(FETCH_FALLBACK_MESSAGE)
      setGames(data.games)
      setPhase('result')
    } catch (e: unknown) {
      setError((e as Error).message)
      setPhase('idle')
    }
  }

  return (
    <div className="card max-w-xl mx-auto">
      <div className="text-center">
        {/* Wraps to two rows on narrow phones; a stadium radius looks broken
            when it does, so soften the container corners below sm. */}
        <div className="inline-flex flex-wrap justify-center p-1.5 rounded-2xl sm:rounded-full bg-emerald-50 gap-1">
          {MODE_CONFIGS.map((m) => (
            <button
              key={m.key}
              onClick={() => selectMode(m.key)}
              disabled={drawing}
              aria-pressed={mode === m.key}
              className={`px-3.5 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm rounded-full transition disabled:opacity-60 ${
                mode === m.key
                  ? 'font-display bg-gradient-to-b from-brand to-brand-dark text-white shadow'
                  : 'text-gray-500 hover:bg-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-500">{cfg.desc}</p>
      </div>

      <div className="mt-6 space-y-3">
        <FoldSection
          testId="include-grid"
          label="포함할 번호"
          count={include.length}
          max={5}
          open={includeOpen}
          onToggle={() => setIncludeOpen((o) => !o)}
        >
          <SelectableNumberGrid
            selected={include}
            onToggle={(n) => toggle(include, setInclude, 5, n)}
            max={5}
            disabled={exclude}
            accent="brand"
          />
        </FoldSection>
        <FoldSection
          testId="exclude-grid"
          label="제외할 번호"
          count={exclude.length}
          max={cfg.maxExclude}
          open={excludeOpen}
          onToggle={() => setExcludeOpen((o) => !o)}
        >
          <SelectableNumberGrid
            selected={exclude}
            onToggle={(n) => toggle(exclude, setExclude, cfg.maxExclude, n)}
            max={cfg.maxExclude}
            disabled={include}
            accent="red"
          />
        </FoldSection>
        {notice && (
          <p role="status" className="text-amber-700 text-sm text-center">{notice}</p>
        )}
      </div>

      <div className="mt-7 text-center">
        <button onClick={generate} disabled={drawing} className="btn-gold">
          {drawing ? '추첨 중...' : isSlip ? `🎱 ${cfg.games}게임 추천받기` : '🎱 번호 추천받기'}
        </button>
      </div>

      {error && <p role="alert" className="mt-4 text-red-500 text-sm text-center">{error}</p>}

      {drawing && (
        <div className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-amber-50 border border-black/5 flex justify-center">
          <DrawAnimation />
        </div>
      )}

      {phase === 'result' && games.length === 1 && (
        <div className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-amber-50 border border-black/5 text-center">
          <p className="font-display text-brand-dark mb-4">✨ 당신의 행운 번호</p>
          <BallSet balls={games[0]} animate={!reduceMotion} className="justify-center flex-wrap" />
          <div className="mt-6 flex justify-center">
            <KakaoShareButton />
          </div>
        </div>
      )}

      {phase === 'result' && games.length > 1 && (
        <div
          data-testid="slip-result"
          className="mt-8 rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-amber-50 border border-black/5"
        >
          <p className="font-display text-brand-dark mb-4 text-center">🎯 {cfg.label} — {games.length}게임 한 장</p>
          {/* Label above the row: 6 balls only just fit a 360px phone, so never
              make them share a line with the label. */}
          <ol className="space-y-3">
            {games.map((g, i) => (
              <li key={i} className="flex flex-col gap-1">
                <span className="font-display text-xs text-gray-400">{gameLabel(i)}</span>
                <BallSet balls={g} size="sm" dense animate={!reduceMotion} className="flex-wrap" />
              </li>
            ))}
          </ol>
          {cfg.odds && (
            <div className="mt-5 rounded-2xl bg-white/60 px-4 py-3">
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="rounded-full bg-black/5 text-gray-600 px-3 py-1 text-sm">1게임 {pct(cfg.odds.single)}</span>
                <span className="rounded-full bg-black/5 text-gray-600 px-3 py-1 text-sm">랜덤 {cfg.games}게임 {pct(cfg.odds.independent)}</span>
                <span className="rounded-full bg-gold/20 text-gold-dark font-display px-3 py-1 text-sm">이 배치 {pct(cfg.odds.slip)}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {cfg.games * 6}개 번호를 게임마다 겹치지 않게 나눠서, {cfg.games}게임 중 하나라도 5등 이상(3개 이상 일치)에 당첨될 확률을 가장 높였어요.
                번호를 잘 골라서가 아니라 겹치지 않는 배치 덕분이에요 — 로또는 완전 무작위라 번호로 확률을 바꿀 순 없어요.
              </p>
            </div>
          )}
          <div className="mt-5 flex justify-center">
            <KakaoShareButton />
          </div>
        </div>
      )}
    </div>
  )
}
