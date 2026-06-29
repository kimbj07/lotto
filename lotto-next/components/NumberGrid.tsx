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
  const maxWin = Math.max(...counts.map(c => c.win_count), 1)
  const sorted = [...counts].sort((a, b) => a.number - b.number)

  return (
    <div className={`grid grid-cols-9 gap-1 ${className}`}>
      {sorted.map((c, i) => (
        <div
          key={c.number}
          title={`Win: ${c.win_count} | Bonus: ${c.bonus_count}`}
          className={`flex flex-col items-center p-1 rounded text-xs ${
            i < highlightTop ? 'bg-yellow-200 font-bold' : 'bg-gray-100'
          }`}
        >
          <span className="font-bold">{c.number}</span>
          <span className="text-gray-500">{c.win_count}</span>
        </div>
      ))}
    </div>
  )
}
