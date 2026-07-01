interface PageHeroProps {
  emoji: string
  title: string
  subtitle: string
}

export default function PageHero({ emoji, title, subtitle }: PageHeroProps) {
  return (
    <div className="text-center mb-8">
      <div className="text-5xl mb-2">{emoji}</div>
      <h1 className="font-display text-3xl sm:text-4xl text-gray-900">{title}</h1>
      <p className="text-gray-500 mt-2 text-balance">{subtitle}</p>
    </div>
  )
}
