interface LottoBallProps {
  number: number
  isBonus?: boolean
  className?: string
}

export default function LottoBall({ number, isBonus = false, className = '' }: LottoBallProps) {
  return (
    <span
      data-bonus={isBonus ? 'true' : undefined}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
        isBonus
          ? 'bg-red-500 text-white'
          : 'bg-yellow-400 text-gray-900'
      } ${className}`}
    >
      {number}
    </span>
  )
}
