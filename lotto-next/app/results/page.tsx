import PageHero from '@/components/PageHero'
import ResultsClient from '@/components/ResultsClient'

export default function ResultsPage() {
  return (
    <div>
      <PageHero
        emoji="🏆"
        title="번추 결과"
        subtitle="앱이 추천한 번호가 회차별로 몇 등에 당첨됐는지 확인합니다"
      />
      <ResultsClient />
    </div>
  )
}
