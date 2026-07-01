import StatsClient from '@/components/StatsClient'

export default function StatsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 번호 통계</h1>
        <p className="text-gray-500 mt-2">1~45 각 번호의 역대 출현 빈도를 확인합니다</p>
      </div>
      <StatsClient />
    </div>
  )
}
