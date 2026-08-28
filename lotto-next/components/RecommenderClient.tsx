'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import BallSet from './BallSet'
import DrawAnimation from './DrawAnimation'
import SelectableNumberGrid from './SelectableNumberGrid'
import KakaoShareButton from './KakaoShareButton'
import type { RecommendMode } from '@/types/lotto'
import { TARGET5_MAX_EXCLUDE } from '@/types/lotto'

// Minimum time the draw cage spins, so a fast fetch still shows a full draw
// instead of a flash. A slow fetch just spins longer.
const MIN_SPIN_MS = 800

type Phase = 'idle' | 'drawing' | 'result'

const MODES: { key: RecommendMode; label: string; desc: string }[] = [
  { key: 'stats', label: '통계 기반', desc: '자주 나온 번호와 최근 보너스 번호를 피하고, 저빈도·중간 빈도 번호를 섞어 추천합니다.' },
  { key: 'exception', label: '제외 기반', desc: '통계 기반 규칙에 더해 8회차 전 당첨 번호에서 하나를 골라 변화를 줍니다.' },
  { key: 'random', label: '랜덤', desc: '1~45에서 완전 무작위로 6개를 뽑습니다.' },
  { key: 'target5', label: '5등 노리기', desc: '5게임(5,000원) 한 장을 30개 번호가 서로 겹치지 않게 짭니다. 5게임 중 한 게임이라도 3개 이상 맞을 확률이 가장 높은 배치예요.' },
]

const DEFAULT_MAX_EXCLUDE = 38
const GAME_LABELS = ['A', 'B', 'C', 'D', 'E']

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
  const [numbers, setNumbers] = useState<number[]>([])
  const [games, setGames] = useState<number[][]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
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

  const desc = MODES.find(m => m.key === mode)!.desc
  const drawing = phase === 'drawing'
  const isSlip = mode === 'target5'
  // target5 needs 30 distinct numbers, so it caps excludes at 15.
  const maxExclude = isSlip ? TARGET5_MAX_EXCLUDE : DEFAULT_MAX_EXCLUDE

  function toggle(list: number[], set: (v: number[]) => void, max: number, n: number) {
    if (list.includes(n)) set(list.filter(x => x !== n))
    else if (list.length < max) set([...list, n])
  }

  function selectMode(next: RecommendMode) {
    setMode(next)
    // Drop excludes beyond the tighter slip cap so the request stays valid.
    if (next === 'target5' && exclude.length > TARGET5_MAX_EXCLUDE) {
      setExclude(exclude.slice(0, TARGET5_MAX_EXCLUDE))
    }
    // A result from another mode has a different shape; clear it.
    setPhase('idle')
    setError(null)
  }

  async function generate() {
    setError(null)
    setPhase('drawing')
    const minSpin = new Promise<void>((r) => setTimeout(r, reduceMotion ? 0 : MIN_SPIN_MS))
    try {
      const params = new URLSearchParams({ mode })
      if (include.length) params.set('include', include.join(','))
      if (exclude.length) params.set('exclude', exclude.join(','))
      // Fetch and the minimum spin run together; reveal once both are done.
      const [res] = await Promise.all([fetch(`/api/recommend?${params}`), minSpin])
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (isSlip) setGames(data.games)
      else setNumbers(data.numbers)
      setPhase('result')
    } catch (e: unknown) {
      setError((e as Error).message)
      setPhase('idle')
    }
  }

  return (
    <div className="card max-w-xl mx-auto">
      <div className="text-center">
        <div className="inline-flex flex-wrap justify-center p-1.5 rounded-full bg-emerald-50 gap-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => selectMode(m.key)}
              className={`px-5 py-2.5 rounded-full text-sm transition ${
                mode === m.key
                  ? 'font-display bg-gradient-to-b from-brand to-brand-dark text-white shadow'
                  : 'text-gray-500 hover:bg-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-500">{desc}</p>
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
          max={maxExclude}
          open={excludeOpen}
          onToggle={() => setExcludeOpen((o) => !o)}
        >
          <SelectableNumberGrid
            selected={exclude}
            onToggle={(n) => toggle(exclude, setExclude, maxExclude, n)}
            max={maxExclude}
            disabled={include}
            accent="red"
          />
        </FoldSection>
      </div>

      <div className="mt-7 text-center">
        <button onClick={generate} disabled={drawing} className="btn-gold">
          {drawing ? '추첨 중...' : isSlip ? '🎱 5게임 추천받기' : '🎱 번호 추천받기'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}

      {drawing && (
        <div className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-amber-50 border border-black/5 flex justify-center">
          <DrawAnimation />
        </div>
      )}

      {phase === 'result' && !isSlip && numbers.length > 0 && (
        <div className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-amber-50 border border-black/5 text-center">
          <p className="font-display text-brand-dark mb-4">✨ 당신의 행운 번호</p>
          <BallSet balls={numbers} animate={!reduceMotion} className="justify-center flex-wrap" />
          <div className="mt-6 flex justify-center">
            <KakaoShareButton />
          </div>
        </div>
      )}

      {phase === 'result' && isSlip && games.length > 0 && (
        <div
          data-testid="slip-result"
          className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-amber-50 border border-black/5"
        >
          <p className="font-display text-brand-dark mb-4 text-center">🎯 5등 노리기 — 5게임 한 장</p>
          <ol className="space-y-2.5">
            {games.map((g, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-6 shrink-0 font-display text-sm text-gray-400">{GAME_LABELS[i]}</span>
                <BallSet balls={g} size="sm" animate={!reduceMotion} className="flex-wrap" />
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-2xl bg-white/60 px-4 py-3 text-xs leading-relaxed text-gray-500">
            <p>
              30개 번호가 한 번도 겹치지 않아, <b className="text-gray-700">5게임 중 1게임 이상 5등(3개 일치)</b> 확률이{' '}
              <b className="font-display text-brand-dark">11.9%</b>로 5게임 배치 중 가장 높아요.
              (랜덤 5게임 11.2% · 1게임 2.4%)
            </p>
            <p className="mt-1">
              로또는 순수 무작위라 번호 자체로 확률을 올릴 순 없어요 — 겹치지 않는 배치만이 &ldquo;한 번이라도 맞을&rdquo; 확률을 올립니다.
            </p>
          </div>
          <div className="mt-5 flex justify-center">
            <KakaoShareButton />
          </div>
        </div>
      )}
    </div>
  )
}
