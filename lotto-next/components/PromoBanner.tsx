export default function PromoBanner() {
  return (
    <a
      href="https://mengsaju.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="멍사주 — 무료 사주 운세 사이트를 새 탭에서 엽니다"
      className="group block w-full rounded-[1.75rem] border border-amber-100 bg-gradient-to-br from-amber-50/70 to-emerald-50/50 px-6 py-5 sm:px-8 sm:py-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-200/50 hover:border-amber-200"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-display text-lg text-gray-800 leading-snug">
            🐶 멍사주 · 무료 사주 운세
          </p>
          <p className="text-sm text-gray-500 truncate">
            나와 반려동물의 사주를 무료로 확인해보세요
          </p>
        </div>
        <span className="shrink-0 font-display text-sm text-amber-600 group-hover:text-amber-700 transition-colors whitespace-nowrap">
          운세 보러 가기 →
        </span>
      </div>
    </a>
  )
}
