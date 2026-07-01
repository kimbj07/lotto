'use client'

import { useState } from 'react'
import BallSet from './BallSet'
import type { RecommendMode } from '@/types/lotto'

const MODES: { key: RecommendMode; label: string }[] = [
  { key: 'stats', label: '통계 기반' },
  { key: 'exception', label: '제외 기반' },
  { key: 'random', label: '랜덤' },
]

export default function RecommenderClient() {
  const [mode, setMode] = useState<RecommendMode>('stats')
  const [numbers, setNumbers] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/recommend?mode=${mode}`)
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
    <div className="card max-w-xl mx-auto text-center">
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

      <div className="mt-7">
        <button onClick={generate} disabled={loading} className="btn-gold">
          {loading ? '추첨 중...' : '🎱 번호 추천받기'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

      {numbers.length > 0 && (
        <div className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-amber-50 border border-black/5">
          <p className="font-display text-brand-dark mb-4">✨ 당신의 행운 번호</p>
          <BallSet balls={numbers} className="justify-center flex-wrap" />
        </div>
      )}
    </div>
  )
}
