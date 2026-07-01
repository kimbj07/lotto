import LottoBall from './LottoBall'

const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1)

interface Props {
  selected: number[]
  onToggle: (n: number) => void
  max: number
  disabled?: number[]
  accent?: 'brand' | 'red'
}

export default function SelectableNumberGrid({
  selected, onToggle, max, disabled = [], accent = 'brand',
}: Props) {
  const atMax = selected.length >= max
  const ring = accent === 'red' ? 'ring-red-400' : 'ring-brand'
  return (
    <div className="grid grid-cols-9 gap-1.5 justify-items-center">
      {ALL_NUMBERS.map((n) => {
        const isSelected = selected.includes(n)
        const isDisabled = !isSelected && (disabled.includes(n) || atMax)
        return (
          <button
            key={n}
            type="button"
            aria-label={String(n)}
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={() => onToggle(n)}
            className={`rounded-full transition ${
              isSelected ? `ring-2 ${ring} ring-offset-1 ring-offset-white` : ''
            } ${isDisabled ? 'opacity-30' : 'hover:scale-105'}`}
          >
            <LottoBall number={n} size="sm" />
          </button>
        )
      })}
    </div>
  )
}
