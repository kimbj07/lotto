import LottoBall from './LottoBall'

interface BallSetProps {
  balls: number[]
  bonusBall?: number
  className?: string
}

export default function BallSet({ balls, bonusBall, className = '' }: BallSetProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {balls.map((n, i) => (
        <LottoBall key={i} number={n} />
      ))}
      {bonusBall !== undefined && (
        <>
          <span className="text-gray-400 font-bold">+</span>
          <LottoBall number={bonusBall} isBonus />
        </>
      )}
    </div>
  )
}
