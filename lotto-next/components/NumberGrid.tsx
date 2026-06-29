import type { AppearanceCount } from '@/types/lotto'

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
    [...counts].sort((a, b) => b.win_count - a.win_count).slice(0, highlightTop).map(c => c.number)
  )
  const sorted = [...counts].sort((a, b) => a.number - b.number)

  return (
    <div className={`grid grid-cols-9 gap-1 ${className}`}>
      {sorted.map((c) => (
        <div
          key={c.number}
          title={`Win: ${c.win_count} | Bonus: ${c.bonus_count}`}
          className={`flex flex-col items-center p-1 rounded text-xs ${
            topNumbers.has(c.number) ? 'bg-yellow-200 font-bold' : 'bg-gray-100'
          }`}
        >
          <span className="font-bold">{c.number}</span>
          <span className="text-gray-500">{c.win_count}</span>
        </div>
      ))}
    </div>
  )
}
