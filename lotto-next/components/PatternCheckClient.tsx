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

function Verdict({ t }: { t: PatternTest }) {
  if (t.verdict === 'none') {
    return <span className="rounded-full bg-black/5 text-gray-600 px-2.5 py-1 text-xs whitespace-nowrap">차이 없음</span>
  }
  return (
    <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-xs whitespace-nowrap">
      {t.verdict === 'more' ? '더 나옴' : '덜 나옴'}
    </span>
  )
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
          로또 플레이어들이 흔히 믿는 가설을 <b className="text-gray-700">역대 당첨 번호 전부</b>로 검사합니다.
          어떤 번호든 한 회차에 나올 확률은 6/45 = <b className="text-gray-700">13.33%</b>예요.
          이보다 뚜렷하게 높거나 낮아야 &ldquo;패턴&rdquo;입니다.
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

          <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
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
                      <span className="block text-[11px] text-gray-400 mt-1">z = {t.z}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50/60 px-4 py-3 text-sm">
              <p className="font-medium text-gray-700 mb-1">45개 번호의 출현 빈도는 고른가?</p>
              <p className="text-gray-600">
                χ² = <b className="font-display text-gray-900">{data.uniformity.chi2}</b>{' '}
                (기준 {data.uniformity.cutoff95}) →{' '}
                <b className={data.uniformity.uniform ? 'text-brand-dark' : 'text-amber-700'}>
                  {data.uniformity.uniform ? '균등' : '균등하지 않음'}
                </b>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                번호당 기대 {data.uniformity.expectedPerNumber}회, 표준편차 ±{data.uniformity.sd}.
                최다 {data.mostFrequent.map(f => `${f.number}번(${f.count})`).join(' ')} ·
                최소 {data.leastFrequent.map(f => `${f.number}번(${f.count})`).join(' ')}
                — 45개 중 최대·최소는 원래 ±2σ 근처에 있어요.
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50/60 px-4 py-3 text-sm">
              <p className="font-medium text-gray-700 mb-1">전반기 핫넘버가 후반기에도 핫한가?</p>
              <p className="text-gray-600">
                상관계수 r = <b className="font-display text-gray-900">{data.splitHalfR}</b>{' '}
                (지속되면 1에 가까움) → <b className="text-brand-dark">{Math.abs(data.splitHalfR) < 0.5 ? '지속성 없음' : '지속성 있음'}</b>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                앞 절반 회차에서 많이 나온 번호가 뒤 절반에서도 많이 나오는지 봅니다.
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 rounded-2xl bg-white/60 border border-black/5 px-4 py-3">
            <b className="text-gray-800">결론:</b> 활용할 수 있는 패턴은 없습니다. 추첨기는 매주 45개 공을 새로 넣고,
            공에는 지난주 기억이 없어요. 어떤 번호를 고르든 한 게임의 5등(3개 일치) 확률은 <b>2.38%</b>로 같습니다.
          </p>
        </>
      )}
    </section>
  )
}
