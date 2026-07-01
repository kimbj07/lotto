import { computeRank } from '../rank'

describe('computeRank', () => {
  it('6 matches → 1등', () => expect(computeRank(6, 0)).toBe(1))
  it('5 matches + bonus → 2등', () => expect(computeRank(5, 1)).toBe(2))
  it('5 matches no bonus → 3등', () => expect(computeRank(5, 0)).toBe(3))
  it('4 matches → 4등', () => expect(computeRank(4, 0)).toBe(4))
  it('3 matches → 5등', () => expect(computeRank(3, 0)).toBe(5))
  it('2 matches → no prize', () => expect(computeRank(2, 0)).toBeNull())
  it('0 matches → no prize', () => expect(computeRank(0, 0)).toBeNull())
})
