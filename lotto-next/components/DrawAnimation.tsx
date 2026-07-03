// Lottery-cage draw animation, shown while a recommendation is being fetched.
// A dashed ring spins around three small balls that jostle inside the "cage".
// Purely decorative — the balls carry no numbers.
export default function DrawAnimation() {
  return (
    <div
      role="status"
      aria-label="번호 추첨 중"
      className="flex flex-col items-center gap-4"
    >
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-brand/40 animate-cage-spin" />
        <div className="absolute inset-0 flex items-center justify-center gap-1.5">
          <span className="ball ball-sm ball-y animate-cage-bounce" style={{ animationDelay: '0ms' }} />
          <span className="ball ball-sm ball-b animate-cage-bounce" style={{ animationDelay: '150ms' }} />
          <span className="ball ball-sm ball-r animate-cage-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      <p className="font-display text-sm text-brand-dark">행운 번호를 뽑는 중…</p>
    </div>
  )
}
