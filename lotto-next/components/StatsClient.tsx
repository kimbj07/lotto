'use client'

import { useState, useEffect, useRef } from 'react'
import NumberGrid from './NumberGrid'
import { fetchJson } from '@/lib/fetchJson'
import type { AppearanceCount, AppearanceSortBy, SortOrder } from '@/types/lotto'

export default function StatsClient() {
  const [sortBy, setSortBy] = useState<AppearanceSortBy>('winCount')
  const [order, setOrder] = useState<SortOrder>('DESC')
  const [stats, setStats] = useState<AppearanceCount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Monotonic request id: flipping the sort twice on a slow connection used to
  // let the OLDER response land last and show a sort the user isn't on.
  const seqRef = useRef(0)

  useEffect(() => {
    const seq = ++seqRef.current
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ sortBy, order })
    fetchJson<{ stats: AppearanceCount[] }>(`/api/stats?${params}`, { signal: controller.signal })
      .then((data) => { if (seq === seqRef.current) setStats(data.stats) })
      .catch((e: unknown) => {
        if (seq !== seqRef.current || (e as Error).name === 'AbortError') return
        setError((e as Error).message)
      })
      .finally(() => { if (seq === seqRef.current) setLoading(false) })
    // Abort the superseded request (and any in flight on unmount).
    return () => controller.abort()
  }, [sortBy, order])

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-600 mb-1.5">정렬 기준</label>
            <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value as AppearanceSortBy)} className="field">
              <option value="winCount">당첨 번호 출현</option>
              <option value="bonusCount">보너스 번호 출현</option>
              <option value="sumCount">전체 출현</option>
              <option value="number">번호 순</option>
            </select>
          </div>
          <div>
            <label htmlFor="statsOrder" className="block text-sm font-medium text-gray-600 mb-1.5">정렬 방향</label>
            <select id="statsOrder" value={order} onChange={(e) => setOrder(e.target.value as SortOrder)} className="field">
              <option value="DESC">내림차순</option>
              <option value="ASC">오름차순</option>
            </select>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 text-red-500 text-sm">{error}</p>}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">로딩 중...</p>
      ) : (
        <>
          <div className="card">
            <p className="font-display text-lg text-gray-900 mb-1">번호별 출현 빈도</p>
            <p className="text-xs text-gray-400 mb-5">🟡 테두리는 출현 상위 5개 번호</p>
            <NumberGrid counts={stats} highlightTop={5} />
          </div>

          <div className="card !p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-50/60 text-gray-500">
                  <th className="p-3 text-left font-medium">번호</th>
                  <th className="p-3 text-right font-medium">당첨 출현</th>
                  <th className="p-3 text-right font-medium">보너스 출현</th>
                  <th className="p-3 text-right font-medium">합계</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.number} className="border-t border-black/5 hover:bg-gray-50">
                    <td className="p-3 font-display text-gray-900">{s.number}</td>
                    <td className="p-3 text-right">{String(s.win_count)}</td>
                    <td className="p-3 text-right">{String(s.bonus_count)}</td>
                    <td className="p-3 text-right">{String(s.sum_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
