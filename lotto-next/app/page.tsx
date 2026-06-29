import RecommenderClient from '@/components/RecommenderClient'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎱 번호 추천</h1>
        <p className="text-gray-500 mt-2">당신의 행운의 번호를 뽑아보세요</p>
      </div>
      <RecommenderClient />
    </div>
  )
}
