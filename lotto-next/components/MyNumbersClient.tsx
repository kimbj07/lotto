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
    if (nums.some(n => isNaN(n) || n < 1 || n > 45)) {
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
      <div className="flex flex-wrap gap-2 items-center">
        {inputs.map((val, i) => (
          <input
            key={i}
            type="number" min={1} max={45}
            value={val}
            onChange={e => setInput(i, e.target.value)}
            placeholder={String(i + 1)}
            className="border rounded px-3 py-2 w-16 text-center text-sm font-bold"
          />
        ))}
        <button
          onClick={check} disabled={loading}
          className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg disabled:opacity-50"
        >
          {loading ? '확인 중...' : '이력 확인'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {results !== null && (
        <div>
          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">3개 이상 일치한 회차가 없습니다</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 border-b">회차</th>
                  <th className="p-3 border-b">일치 번호 수</th>
                  <th className="p-3 border-b">보너스 일치</th>
                  <th className="p-3 border-b">등수</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.game_no} className="hover:bg-gray-50 border-b">
                    <td className="p-3 font-medium">{r.game_no}회</td>
                    <td className="p-3">{r.win_number_count}개</td>
                    <td className="p-3">{r.bonus_number_count > 0 ? '일치' : '-'}</td>
                    <td className="p-3 font-bold">{r.rank ? RANK_LABEL[r.rank] : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
