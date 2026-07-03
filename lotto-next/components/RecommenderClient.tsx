'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import BallSet from './BallSet'
import SelectableNumberGrid from './SelectableNumberGrid'
import KakaoShareButton from './KakaoShareButton'
import type { RecommendMode } from '@/types/lotto'

const MODES: { key: RecommendMode; label: string; desc: string }[] = [
  { key: 'stats', label: '통계 기반', desc: '자주 나온 번호와 최근 보너스 번호를 피하고, 저빈도·중간 빈도 번호를 섞어 추천합니다.' },
  { key: 'exception', label: '제외 기반', desc: '통계 기반 규칙에 더해 8회차 전 당첨 번호에서 하나를 골라 변화를 줍니다.' },
  { key: 'random', label: '랜덤', desc: '1~45에서 완전 무작위로 6개를 뽑습니다.' },
]

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [includeOpen, setIncludeOpen] = useState(false)
  const [excludeOpen, setExcludeOpen] = useState(false)

  const desc = MODES.find(m => m.key === mode)!.desc

  function toggle(list: number[], set: (v: number[]) => void, max: number, n: number) {
    if (list.includes(n)) set(list.filter(x => x !== n))
    else if (list.length < max) set([...list, n])
  }

  async function generate() {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ mode })
      if (include.length) params.set('include', include.join(','))
      if (exclude.length) params.set('exclude', exclude.join(','))
      const res = await fetch(`/api/recommend?${params}`)
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
    <div className="card max-w-xl mx-auto">
      <div className="text-center">
        <div className="inline-flex flex-wrap justify-center p-1.5 rounded-full bg-emerald-50 gap-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
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
          max={38}
          open={excludeOpen}
          onToggle={() => setExcludeOpen((o) => !o)}
        >
          <SelectableNumberGrid
            selected={exclude}
            onToggle={(n) => toggle(exclude, setExclude, 38, n)}
            max={38}
            disabled={include}
            accent="red"
          />
        </FoldSection>
      </div>

      <div className="mt-7 text-center">
        <button onClick={generate} disabled={loading} className="btn-gold">
          {loading ? '추첨 중...' : '🎱 번호 추천받기'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}

      {numbers.length > 0 && (
        <div className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-amber-50 border border-black/5 text-center">
          <p className="font-display text-brand-dark mb-4">✨ 당신의 행운 번호</p>
          <BallSet balls={numbers} className="justify-center flex-wrap" />
          <div className="mt-6 flex justify-center">
            <KakaoShareButton />
          </div>
        </div>
      )}
    </div>
  )
}
