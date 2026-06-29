'use client'

import { useState } from 'react'
import BallSet from './BallSet'
import type { GameInfo } from '@/types/lotto'

export default function HistoryClient() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [games, setGames] = useState<GameInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ order })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    try {
      const res = await fetch(`/api/history?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGames(data.games)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작 회차</label>
          <input
            type="number" value={from} onChange={e => setFrom(e.target.value)}
            placeholder="예: 1" min={1}
            className="border rounded px-3 py-2 w-28 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료 회차</label>
          <input
            type="number" value={to} onChange={e => setTo(e.target.value)}
            placeholder="예: 100" min={1}
            className="border rounded px-3 py-2 w-28 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">정렬</label>
          <select
            value={order} onChange={e => setOrder(e.target.value as 'ASC' | 'DESC')}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="DESC">최신순</option>
            <option value="ASC">오래된순</option>
          </select>
        </div>
        <button
          onClick={search} disabled={loading}
          className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg disabled:opacity-50"
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {games.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border-b">회차</th>
                <th className="p-3 border-b">날짜</th>
                <th className="p-3 border-b">당첨 번호</th>
                <th className="p-3 border-b text-right">1등 당첨금</th>
                <th className="p-3 border-b text-right">1등 당첨자</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => (
                <tr key={g.game_no} className="hover:bg-gray-50 border-b">
                  <td className="p-3 font-medium">{g.game_no}회</td>
                  <td className="p-3 text-gray-500">{g.game_date}</td>
                  <td className="p-3">
                    <BallSet
                      balls={[g.first_ball, g.second_ball, g.third_ball, g.fourth_ball, g.fifth_ball, g.sixth_ball]}
                      bonusBall={g.bonus_ball}
                    />
                  </td>
                  <td className="p-3 text-right">{g.first_winner_amount.toLocaleString()}원</td>
                  <td className="p-3 text-right">{g.first_winner_count}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {games.length === 0 && !loading && !error && (
        <p className="text-gray-400 text-center py-8">회차 범위를 입력하고 조회하세요</p>
      )}
    </div>
  )
}
