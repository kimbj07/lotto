// Korean lotto prize-rank rule. Single source of truth shared by the
// my-numbers lookup and the recommendation grading path.
export function computeRank(
  winCount: number,
  bonusCount: number
): 1 | 2 | 3 | 4 | 5 | null {
  if (winCount === 6) return 1
  if (winCount === 5 && bonusCount === 1) return 2
  if (winCount === 5) return 3
  if (winCount === 4) return 4
  if (winCount === 3) return 5
  return null
}
