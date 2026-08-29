'use client'

import { useState, useEffect } from 'react'
import type {
  RecommendationSummary,
  RecommendationRoundSummary,
  RecommendationModeSummary,
} from '@/types/lotto'
import { MODE_CONFIGS, isRecommendMode, modeConfig } from '@/lib/recommendModes'
import { fetchJson } from '@/lib/fetchJson'

const RANKS = [1, 2, 3, 4, 5] as const

// Fixed display order + Korean labels for the per-mode breakdown.
const MODE_LABELS = MODE_CONFIGS.map(m => ({ key: m.key as string, label: m.label }))

function gamesPerSlip(mode: string): number {
  return isRecommendMode(mode) ? modeConfig(mode).games : 1
}

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

// Slip-level line for multi-game modes (target5): the metric that mode
// optimises is "at least one of the slip's games ranked", not per-game wins.
// Rendered only once migration 008 has populated slip columns.
function SlipStats({ r }: { r: RecommendationModeSummary }) {
  const total = r.slip_total ?? 0
  if (total === 0) return null
  const graded = r.slip_graded ?? 0
  const hit = r.slip_hit ?? 0
  return (
    <p data-testid="slip-stats" className="text-sm text-gray-600">
      한 장({gamesPerSlip(r.mode)}게임) 적중률{' '}
      {graded > 0 ? (
        <>
          <b className="font-display text-brand-dark">{((hit / graded) * 100).toFixed(1)}%</b>
          {' '}— {graded.toLocaleString()}장 중 {hit.toLocaleString()}장에서 1게임 이상 당첨
        </>
      ) : (
        <span className="text-amber-700">{total.toLocaleString()}장 집계 예정</span>
      )}
    </p>
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
                  <span className="text-right">
                    <span className="font-display text-2xl text-brand-dark">
                      {rate.toFixed(1)}%
                    </span>
                    {/* Slip modes show two differently-scoped rates; label this one. */}
                    {gamesPerSlip(key) > 1 && (
                      <span className="block text-[11px] text-gray-400">게임당 적중률</span>
                    )}
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
                  <SlipStats r={r} />
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
    let alive = true // no setState after unmount
    fetchJson<RecommendationSummary>('/api/recommendations/summary')
      .then((json) => { if (alive) setData(json) })
      .catch((e: unknown) => { if (alive) setError((e as Error).message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
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
