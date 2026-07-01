interface LottoBallProps {
  number: number
  isBonus?: boolean
  size?: 'md' | 'sm'
  className?: string
}

// Authentic dhlottery color scheme by number range.
function colorClass(n: number): string {
  if (n <= 10) return 'ball-y'
  if (n <= 20) return 'ball-b'
  if (n <= 30) return 'ball-r'
  if (n <= 40) return 'ball-g'
  return 'ball-n'
}

export default function LottoBall({
  number,
  isBonus = false,
  size = 'md',
  className = '',
}: LottoBallProps) {
  return (
    <span
      data-bonus={isBonus ? 'true' : undefined}
      className={`ball ${size === 'sm' ? 'ball-sm' : ''} ${colorClass(number)} ${className}`}
    >
      {number}
    </span>
  )
}
