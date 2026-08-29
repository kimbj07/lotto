import LottoBall from './LottoBall'

interface BallSetProps {
  balls: number[]
  bonusBall?: number
  size?: 'md' | 'sm'
  className?: string
  // When true, the balls tumble in one after another (150ms apart).
  animate?: boolean
  // Tighter spacing for stacked multi-game layouts on narrow screens.
  dense?: boolean
}

export default function BallSet({
  balls, bonusBall, size = 'md', className = '', animate = false, dense = false,
}: BallSetProps) {
  return (
    <div className={`flex items-center ${dense ? 'gap-1.5' : 'gap-2'} ${className}`}>
      {balls.map((n, i) => (
        <LottoBall key={i} number={n} size={size} animate={animate} animationDelayMs={i * 150} />
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
