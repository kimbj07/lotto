import MyNumbersClient from '@/components/MyNumbersClient'

export default function MyNumbersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🔢 내 번호 확인</h1>
        <p className="text-gray-500 mt-2">내 번호가 역대 로또 결과에서 당첨된 적 있는지 확인합니다 (3개 이상 일치)</p>
      </div>
      <MyNumbersClient />
    </div>
  )
}
