import HistoryClient from '@/components/HistoryClient'

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">당첨 이력</h1>
        <p className="text-gray-500 mt-2">회차별 당첨 번호를 조회합니다</p>
      </div>
      <HistoryClient />
    </div>
  )
}
