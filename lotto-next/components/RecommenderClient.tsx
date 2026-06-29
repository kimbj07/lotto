'use client'

import { useState } from 'react'
import BallSet from './BallSet'
import type { RecommendMode } from '@/types/lotto'

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
    <div className="space-y-6">
      <div className="flex gap-4">
        {(['stats', 'exception', 'random'] as RecommendMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              mode === m
                ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                : 'border-gray-300 text-gray-600 hover:border-yellow-400'
            }`}
          >
            {m === 'stats' ? '통계 기반' : m === 'exception' ? '제외 기반' : '랜덤'}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? '추첨 중...' : '번호 추천받기'}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {numbers.length > 0 && (
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <BallSet balls={numbers} />
        </div>
      )}
    </div>
  )
}
