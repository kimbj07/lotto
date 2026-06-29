'use client'

import { useState, useEffect } from 'react'
import NumberGrid from './NumberGrid'
import type { AppearanceCount, AppearanceSortBy, SortOrder } from '@/types/lotto'

export default function StatsClient() {
  const [sortBy, setSortBy] = useState<AppearanceSortBy>('winCount')
  const [order, setOrder] = useState<SortOrder>('DESC')
  const [stats, setStats] = useState<AppearanceCount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ sortBy, order })
    try {
      const res = await fetch(`/api/stats?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStats(data.stats)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sortBy, order])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">정렬 기준</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as AppearanceSortBy)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="winCount">당첨 번호 출현</option>
            <option value="bonusCount">보너스 번호 출현</option>
            <option value="sumCount">전체 출현</option>
            <option value="number">번호 순</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">정렬 방향</label>
          <select
            value={order}
            onChange={e => setOrder(e.target.value as SortOrder)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="DESC">내림차순</option>
            <option value="ASC">오름차순</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-400">로딩 중...</p>
      ) : (
        <div className="space-y-4">
          <NumberGrid counts={stats} highlightTop={5} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 border-b">번호</th>
                  <th className="p-3 border-b text-right">당첨 출현</th>
                  <th className="p-3 border-b text-right">보너스 출현</th>
                  <th className="p-3 border-b text-right">합계</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => (
                  <tr key={s.number} className="hover:bg-gray-50 border-b">
                    <td className="p-3 font-bold">{s.number}</td>
                    <td className="p-3 text-right">{String(s.win_count)}</td>
                    <td className="p-3 text-right">{String(s.bonus_count)}</td>
                    <td className="p-3 text-right">{String(s.sum_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
