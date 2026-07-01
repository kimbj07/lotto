import PageHero from '@/components/PageHero'
import HistoryClient from '@/components/HistoryClient'

export default function HistoryPage() {
  return (
    <div>
      <PageHero emoji="📜" title="당첨 이력" subtitle="회차별 당첨 번호를 조회합니다" />
      <HistoryClient />
    </div>
  )
}
