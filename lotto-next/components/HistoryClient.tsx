'use client'

import { useState, useEffect } from 'react'
import BallSet from './BallSet'
import type { GameInfo } from '@/types/lotto'

const LATEST_COUNT = 5

export default function HistoryClient() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [games, setGames] = useState<GameInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showingLatest, setShowingLatest] = useState(true)

  async function fetchGames(params: URLSearchParams, latest: boolean) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/history?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGames(data.games)
      setShowingLatest(latest)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Show the most recent draws by default when the page opens.
  useEffect(() => {
    fetchGames(new URLSearchParams({ order: 'DESC', count: String(LATEST_COUNT) }), true)
  }, [])

  async function search() {
    const params = new URLSearchParams({ order })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    await fetchGames(params, false)
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="from" className="block text-sm font-medium text-gray-600 mb-1.5">시작 회차</label>
            <input id="from" type="number" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="예: 1" min={1} className="field w-28" />
          </div>
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-600 mb-1.5">종료 회차</label>
            <input id="to" type="number" value={to} onChange={(e) => setTo(e.target.value)} placeholder="예: 100" min={1} className="field w-28" />
          </div>
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-600 mb-1.5">정렬</label>
            <select id="order" value={order} onChange={(e) => setOrder(e.target.value as 'ASC' | 'DESC')} className="field">
              <option value="DESC">최신순</option>
              <option value="ASC">오래된순</option>
            </select>
          </div>
          <button onClick={search} disabled={loading} className="btn-gold text-base px-7 py-2.5">
            {loading ? '조회 중...' : '조회'}
          </button>
        </div>
        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
      </div>

      {games.length > 0 && (
        <div className="space-y-3">
          {showingLatest && (
            <p className="font-display text-lg text-gray-900 px-1">🎉 최신 당첨 번호</p>
          )}
          {games.map((g) => (
            <div
              key={g.game_no}
              className="card !p-4 sm:!p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            >
              <div className="shrink-0 w-20">
                <div className="font-display text-lg text-gray-900">{g.game_no}회</div>
                <div className="text-xs text-gray-400">{g.game_date}</div>
              </div>
              <div className="flex-1 overflow-x-auto">
                <BallSet
                  balls={[g.first_ball, g.second_ball, g.third_ball, g.fourth_ball, g.fifth_ball, g.sixth_ball]}
                  bonusBall={g.bonus_ball}
                  size="sm"
                />
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <div className="font-display text-brand-dark">
                  {(g.first_winner_amount ?? 0).toLocaleString()}원
                </div>
                <div className="text-xs text-gray-400">1등 {g.first_winner_count}명</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {games.length === 0 && !loading && !error && (
        <p className="text-gray-400 text-center py-8">해당 범위의 당첨 이력이 없습니다 🔍</p>
      )}
    </div>
  )
}
