'use client'

import { useEffect, useState } from 'react'
import { fetchJson } from '@/lib/fetchJson'
import type { PatternReport, PatternTest } from '@/types/lotto'

// Korean labels for the hypotheses in lib/patterns.ts, keyed by test key.
const LABELS: Record<string, string> = {
  prev_bonus_repeat: '지난 회차 보너스 번호가 이번 회차에 나온다',
  prev_main_repeat: '지난 회차 당첨 번호가 이번 회차에 다시 나온다',
  cumulative_hot: '역대 가장 많이 나온 5개 번호가 나온다',
  cumulative_cold: '역대 가장 적게 나온 5개 번호가 나온다',
  recent_hot: '최근 20회에서 가장 많이 나온 10개 번호가 나온다',
}

const pct = (v: number) => `${(v * 100).toFixed(2)}%`

// Verdict chips reuse the RankChips look from /results (rounded-full, text-sm).
function Verdict({ t }: { t: PatternTest }) {
  if (t.verdict === 'none') {
    return <span className="rounded-full bg-black/5 text-gray-600 px-3 py-1 text-sm whitespace-nowrap">차이 없음</span>
  }
  return (
    <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-sm whitespace-nowrap">
      {t.verdict === 'more' ? '더 나옴' : '덜 나옴'}
    </span>
  )
}

// Plain-Korean reading of the statistic first, the number after in parens —
// so a lay reader gets the meaning and a sceptic still gets something to check.
function zClause(t: PatternTest): string {
  return `${t.verdict === 'none' ? '우연 범위 안' : '우연 범위 밖'} (z ${t.z})`
}

export default function PatternCheckClient() {
  const [data, setData] = useState<PatternReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchJson<PatternReport>('/api/stats/patterns')
      .then((r) => { if (alive) setData(r) })
      .catch((e: unknown) => { if (alive) setError((e as Error).message) })
    return () => { alive = false }
  }, [])

  return (
    <section data-testid="pattern-check" className="card space-y-5">
      <div>
        <p className="font-display text-lg text-gray-900 mb-1">🔍 패턴 검증</p>
        <p className="text-sm text-gray-500">
          &ldquo;지난주 보너스 번호는 안 나온다&rdquo;, &ldquo;많이 나온 번호는 계속 나온다&rdquo; 같은 통설을{' '}
          <b className="text-gray-700">역대 당첨 번호 전부</b>로 확인합니다.
          어떤 번호든 한 회차에 나올 확률은 45개 중 6개 = <b className="text-gray-700">13.33%</b>예요.
          실제 결과가 이보다 우연이라고 보기 어려울 만큼 높거나 낮아야 &ldquo;패턴&rdquo;입니다.
        </p>
      </div>

      {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
      {!data && !error && <p className="text-gray-400 text-sm">검증 중...</p>}

      {data && data.draws === 0 && (
        <p className="text-gray-400 text-sm">아직 검증할 회차가 없습니다.</p>
      )}

      {data && data.draws > 0 && (
        <>
          <p className="text-xs text-gray-400">
            {`${data.fromGameNo}회 ~ ${data.toGameNo}회, ${data.draws.toLocaleString()}회차 · 매주 추첨 후 자동 재계산`}
          </p>

          {/* Mobile: one card per hypothesis. A 520px table inside a 360px card
              scrolls the 판정 column — the one answer the reader wants — off
              screen; stacked cards keep claim and verdict together. */}
          <ul className="sm:hidden space-y-2" data-testid="pattern-cards">
            {data.tests.map((t) => (
              <li key={t.key} className="rounded-2xl border border-black/5 bg-emerald-50/40 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-700 flex-1">{LABELS[t.key] ?? t.key}</p>
                  <Verdict t={t} />
                </div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-gray-700">
                    실제 <b className="font-display text-gray-900">{pct(t.observed)}</b>
                    <span className="text-[11px] text-gray-400"> ({t.hits.toLocaleString()}/{t.trials.toLocaleString()})</span>
                  </span>
                  <span className="text-gray-400">기대 {pct(t.expected)}</span>
                </div>
                <p className="text-[11px] text-gray-400">{zClause(t)}</p>
              </li>
            ))}
          </ul>

          {/* sm and up: the table fits comfortably. */}
          <div className="hidden sm:block overflow-x-auto -mx-8 px-8">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-emerald-50/60 text-gray-500">
                  <th className="p-3 text-left font-medium">가설</th>
                  <th className="p-3 text-right font-medium">실제</th>
                  <th className="p-3 text-right font-medium">기대</th>
                  <th className="p-3 text-right font-medium">판정</th>
                </tr>
              </thead>
              <tbody>
                {data.tests.map((t) => (
                  <tr key={t.key} className="border-t border-black/5">
                    <td className="p-3 text-gray-700">{LABELS[t.key] ?? t.key}</td>
                    <td className="p-3 text-right font-display text-gray-900 whitespace-nowrap">
                      {pct(t.observed)}
                      <span className="block text-[11px] font-sans text-gray-400">
                        {t.hits.toLocaleString()} / {t.trials.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-500 whitespace-nowrap">{pct(t.expected)}</td>
                    <td className="p-3 text-right">
                      <Verdict t={t} />
                      <span className="block text-[11px] text-gray-400 mt-1 whitespace-nowrap">{zClause(t)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50/60 px-4 py-3 text-sm">
              <p className="font-medium text-gray-700 mb-1">특별히 잘 나오는 번호가 있나?</p>
              <p className="text-gray-600">
                45개 번호가 나온 횟수의 들쭉날쭉함이 우연으로 설명되는 크기인지 봅니다 →{' '}
                <b className={data.uniformity.uniform ? 'text-brand-dark' : 'text-amber-700'}>
                  {data.uniformity.uniform ? '우연 범위 안' : '우연 범위 밖'}
                </b>
                <span className="text-gray-400"> (χ² {data.uniformity.chi2}, 기준 {data.uniformity.cutoff95})</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {`번호당 평균 ${data.uniformity.expectedPerNumber}회, 보통 ±${data.uniformity.sd}회 안팎으로 흔들려요. ` +
                  `가장 많이 나온 ${data.mostFrequent.map(f => `${f.number}번(${f.count}회)`).join(' ')}, ` +
                  `가장 적게 나온 ${data.leastFrequent.map(f => `${f.number}번(${f.count}회)`).join(' ')} — ` +
                  '45개 중 1등과 꼴찌는 원래 이 정도 차이가 납니다.'}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50/60 px-4 py-3 text-sm">
              <p className="font-medium text-gray-700 mb-1">앞에서 잘 나온 번호가 뒤에서도 잘 나오나?</p>
              <p className="text-gray-600">
                역대 회차를 절반으로 나눠, 앞 절반의 인기 번호가 뒤 절반에서도 인기인지 봅니다 →{' '}
                <b className="text-brand-dark">{Math.abs(data.splitHalfR) < 0.5 ? '이어지지 않음' : '이어짐'}</b>
                <span className="text-gray-400"> (상관 r {data.splitHalfR}, 이어지면 1에 가까움)</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
            <b className="text-gray-900">결론:</b> {data.tests.every(t => t.verdict === 'none') && data.uniformity.uniform
              ? '활용할 수 있는 패턴은 없습니다. '
              : '일부 항목이 우연 범위를 벗어났지만, 아래 표에서 크기를 확인하세요 — 5등 확률을 바꿀 만한 크기는 아닙니다. '}
            추첨기는 매주 45개 공을 새로 넣고, 공에는 지난주 기억이 없어요.
            어떤 번호를 고르든 한 게임의 5등(3개 일치) 확률은 <b>2.38%</b>로 같습니다.
          </p>
        </>
      )}
    </section>
  )
}
