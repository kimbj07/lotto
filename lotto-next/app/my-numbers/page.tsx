import PageHero from '@/components/PageHero'
import MyNumbersClient from '@/components/MyNumbersClient'

export default function MyNumbersPage() {
  return (
    <div>
      <PageHero
        emoji="🔢"
        title="내 번호 확인"
        subtitle="내 번호가 역대 로또 결과에서 당첨된 적 있는지 확인합니다 (3개 이상 일치)"
      />
      <MyNumbersClient />
    </div>
  )
}
