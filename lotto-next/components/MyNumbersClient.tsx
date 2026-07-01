'use client'

import { useState } from 'react'
import type { MyRankInGame } from '@/types/lotto'

const RANK_LABEL: Record<number, string> = {
  1: '1등 🏆',
  2: '2등 🥈',
  3: '3등 🥉',
  4: '4등',
  5: '5등',
}

export default function MyNumbersClient() {
  const [inputs, setInputs] = useState<string[]>(['', '', '', '', '', ''])
  const [results, setResults] = useState<MyRankInGame[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setInput(i: number, val: string) {
    const next = [...inputs]
    next[i] = val
    setInputs(next)
  }

  async function check() {
    const nums = inputs.map(Number)
    if (nums.some((n) => isNaN(n) || n < 1 || n > 45)) {
      setError('1~45 사이의 숫자를 6개 모두 입력하세요')
      return
    }
    if (new Set(nums).size !== 6) {
      setError('중복된 번호가 있습니다')
      return
    }

    setLoading(true)
    setError(null)
    const params = new URLSearchParams(nums.map((n, i) => [`n${i + 1}`, String(n)]))
    try {
      const res = await fetch(`/api/my-numbers?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.results)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card text-center">
        <div className="flex flex-wrap gap-2.5 items-center justify-center">
          {inputs.map((val, i) => (
            <input
              key={i}
              type="number"
              min={1}
              max={45}
              value={val}
              onChange={(e) => setInput(i, e.target.value)}
              placeholder={String(i + 1)}
              aria-label={`번호 ${i + 1}`}
              className="w-12 h-12 rounded-full border-2 border-gray-200 bg-white text-center text-base font-extrabold text-gray-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          ))}
        </div>
        <div className="mt-6">
          <button onClick={check} disabled={loading} className="btn-gold">
            {loading ? '확인 중...' : '🔍 이력 확인'}
          </button>
        </div>
        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
      </div>

      {results !== null &&
        (results.length === 0 ? (
          <p className="text-gray-400 text-center py-8">3개 이상 일치한 회차가 없습니다 🍀</p>
        ) : (
          <div className="space-y-3">
            {results.map((r) => (
              <div
                key={r.game_no}
                className="card !p-4 sm:!p-5 flex items-center justify-between gap-4"
              >
                <div className="font-display text-lg text-gray-900">{r.game_no}회</div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    일치 <b className="text-gray-900">{r.win_number_count}</b>개
                  </span>
                  <span className="text-gray-600">
                    보너스 {r.bonus_number_count > 0 ? '✅' : '—'}
                  </span>
                  <span className="font-display text-brand-dark min-w-16 text-right">
                    {r.rank ? RANK_LABEL[r.rank] : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
