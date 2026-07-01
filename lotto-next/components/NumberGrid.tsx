import type { AppearanceCount } from '@/types/lotto'
import LottoBall from './LottoBall'

interface NumberGridProps {
  counts: AppearanceCount[]
  highlightTop?: number
  className?: string
}

export default function NumberGrid({
  counts,
  highlightTop = 5,
  className = '',
}: NumberGridProps) {
  const topNumbers = new Set(
    [...counts].sort((a, b) => b.win_count - a.win_count).slice(0, highlightTop).map((c) => c.number)
  )
  const sorted = [...counts].sort((a, b) => a.number - b.number)

  return (
    <div className={`grid grid-cols-9 gap-y-3 gap-x-1 justify-items-center ${className}`}>
      {sorted.map((c) => {
        const top = topNumbers.has(c.number)
        return (
          <div
            key={c.number}
            className="flex flex-col items-center gap-1"
            title={`당첨 ${c.win_count} · 보너스 ${c.bonus_count}`}
          >
            <LottoBall
              number={c.number}
              size="sm"
              className={top ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white' : ''}
            />
            <span className={`text-[11px] ${top ? 'font-bold text-amber-600' : 'text-gray-400'}`}>
              {c.win_count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
