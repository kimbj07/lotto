import LottoBall from './LottoBall'

interface BallSetProps {
  balls: number[]
  bonusBall?: number
  size?: 'md' | 'sm'
  className?: string
}

export default function BallSet({ balls, bonusBall, size = 'md', className = '' }: BallSetProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {balls.map((n, i) => (
        <LottoBall key={i} number={n} size={size} />
      ))}
      {bonusBall !== undefined && (
        <>
          <span className="text-gray-300 font-bold px-0.5">+</span>
          <LottoBall number={bonusBall} isBonus size={size} />
        </>
      )}
    </div>
  )
}
