const BANNERS = [
  {
    href: 'https://mengsaju.vercel.app/',
    ariaLabel: '멍사주 — 무료 사주 운세 사이트를 새 탭에서 엽니다',
    title: '🐶 멍사주 · 무료 사주 운세',
    description: '나와 반려동물의 사주를 무료로 확인해보세요',
    cta: '운세 보러 가기 →',
    cardClassName:
      'border-amber-100 bg-gradient-to-br from-amber-50/70 to-emerald-50/50 hover:shadow-amber-200/50 hover:border-amber-200',
    ctaClassName: 'text-amber-600 group-hover:text-amber-700',
  },
  {
    href: 'https://name-gunghap.vercel.app',
    ariaLabel: '이름 궁합 — 이름으로 보는 궁합 테스트를 새 탭에서 엽니다',
    title: '💕 이름 궁합 · 이름으로 보는 궁합',
    description: '두 사람의 한글 이름으로 궁합을 확인해보세요',
    cta: '궁합 보러 가기 →',
    cardClassName:
      'border-pink-100 bg-gradient-to-br from-pink-50/70 to-rose-50/50 hover:shadow-pink-200/50 hover:border-pink-200',
    ctaClassName: 'text-pink-600 group-hover:text-pink-700',
  },
]

export default function PromoBanner() {
  return (
    <div className="flex flex-col gap-3">
      {BANNERS.map((banner) => (
        <a
          key={banner.href}
          href={banner.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={banner.ariaLabel}
          className={`group block w-full rounded-[1.75rem] border px-6 py-5 sm:px-8 sm:py-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${banner.cardClassName}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="font-display text-lg text-gray-800 leading-snug">
                {banner.title}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {banner.description}
              </p>
            </div>
            <span
              className={`shrink-0 font-display text-sm transition-colors whitespace-nowrap ${banner.ctaClassName}`}
            >
              {banner.cta}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
