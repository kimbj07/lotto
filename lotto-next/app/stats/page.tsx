import PageHero from '@/components/PageHero'
import StatsClient from '@/components/StatsClient'
import PatternCheckClient from '@/components/PatternCheckClient'

export default function StatsPage() {
  return (
    <div>
      <PageHero emoji="📊" title="번호 통계" subtitle="1~45 각 번호의 역대 출현 빈도를 확인합니다" />
      <div className="space-y-6">
        <StatsClient />
        <PatternCheckClient />
      </div>
    </div>
  )
}
