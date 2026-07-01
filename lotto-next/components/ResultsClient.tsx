'use client'

import { useState, useEffect } from 'react'
import type {
  RecommendationSummary,
  RecommendationRoundSummary,
  RecommendationModeSummary,
} from '@/types/lotto'

const RANKS = [1, 2, 3, 4, 5] as const

// Fixed display order + Korean labels for the per-mode breakdown.
const MODE_LABELS: { key: string; label: string }[] = [
  { key: 'stats', label: '통계 기반' },
  { key: 'exception', label: '제외 기반' },
  { key: 'random', label: '랜덤' },
]

function wins(r: { rank1: number; rank2: number; rank3: number; rank4: number; rank5: number }) {
  return r.rank1 + r.rank2 + r.rank3 + r.rank4 + r.rank5
}

const EMPTY_MODE: Omit<RecommendationModeSummary, 'mode'> = {
  total: 0, graded_count: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0,
}

function rankCounts(r: {
  rank1: number; rank2: number; rank3: number; rank4: number; rank5: number
}) {
  return [r.rank1, r.rank2, r.rank3, r.rank4, r.rank5]
}

function RankChips({
  r,
}: {
  r: { rank1: number; rank2: number; rank3: number; rank4: number; rank5: number }
}) {
  const counts = rankCounts(r)
  return (
    <div className="flex flex-wrap gap-2">
      {RANKS.map((rank, i) => (
        <span
          key={rank}
          className={`rounded-full px-3 py-1 text-sm ${
            rank === 1
              ? 'bg-gold/20 text-gold-dark font-display'
              : 'bg-black/5 text-gray-600'
          }`}
        >
          {rank}등 <b className="font-display">{counts[i]}</b>
        </span>
      ))}
    </div>
  )
}

function ModeBreakdown({ byMode }: { byMode: RecommendationModeSummary[] }) {
  return (
    <div>
      <h2 className="font-display text-xl text-gray-900 mb-3">모드별 승률</h2>
      <div className="space-y-3">
        {MODE_LABELS.map(({ key, label }) => {
          const r: RecommendationModeSummary =
            byMode.find((m) => m.mode === key) ?? { mode: key, ...EMPTY_MODE }
          const w = wins(r)
          const rate = r.graded_count > 0 ? (w / r.graded_count) * 100 : null
          return (
            <div key={key} className="card !p-4 sm:!p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="font-display text-lg text-gray-900">{label}</div>
                {r.total === 0 ? (
                  <span className="text-sm text-gray-400">아직 번호 추천 없음</span>
                ) : rate === null ? (
                  <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2.5 py-1">
                    집계 예정
                  </span>
                ) : (
                  <span className="font-display text-2xl text-brand-dark">
                    {rate.toFixed(1)}%
                  </span>
                )}
              </div>
              {r.total > 0 && (
                <>
                  {rate !== null && (
                    <p className="text-sm text-gray-500">
                      {w.toLocaleString()} / {r.graded_count.toLocaleString()} 당첨
                    </p>
                  )}
                  <RankChips r={r} />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ResultsClient() {
  const [data, setData] = useState<RecommendationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/recommendations/summary')
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setData(json)
      } catch (e: unknown) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <p className="text-gray-400 text-center py-8">불러오는 중...</p>
  if (error) return <p className="text-red-500 text-center py-8">{error}</p>
  if (!data || data.rounds.length === 0) {
    return (
      <p className="text-gray-400 text-center py-10">
        아직 집계된 번호 추천 결과가 없습니다 🍀
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card bg-brand/5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl text-gray-900">전체 누적</h2>
          <span className="text-sm text-gray-500">
            {data.allTime.total.toLocaleString()} 번호 추천
          </span>
        </div>
        <RankChips r={data.allTime} />
        {data.allTime.graded_count < data.allTime.total && (
          <p className="mt-3 text-xs text-amber-700">일부 회차 집계 예정 포함</p>
        )}
      </div>

      <ModeBreakdown byMode={data.byMode ?? []} />

      <div className="space-y-3">
        {data.rounds.map((round: RecommendationRoundSummary) => {
          const pending = round.graded_count < round.total
          return (
            <div key={round.target_game_no} className="card !p-4 sm:!p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-display text-lg text-gray-900">
                  {round.target_game_no}회차
                </div>
                <div className="flex items-center gap-2">
                  {pending && (
                    <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2.5 py-1">
                      집계 예정
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {round.total.toLocaleString()} 번호 추천
                  </span>
                </div>
              </div>
              <RankChips r={round} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
