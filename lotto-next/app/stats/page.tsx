import PageHero from '@/components/PageHero'
import StatsClient from '@/components/StatsClient'

export default function StatsPage() {
  return (
    <div>
      <PageHero emoji="📊" title="번호 통계" subtitle="1~45 각 번호의 역대 출현 빈도를 확인합니다" />
      <StatsClient />
    </div>
  )
}
