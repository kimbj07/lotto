import PageHero from '@/components/PageHero'
import RecommenderClient from '@/components/RecommenderClient'

export default function HomePage() {
  return (
    <div>
      <PageHero emoji="🍀" title="행운의 번호 추천" subtitle="오늘의 행운 번호 6개를 뽑아드려요" />
      <RecommenderClient />
    </div>
  )
}
