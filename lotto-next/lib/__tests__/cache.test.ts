import { getCached, setCached, clearCache, cacheSize } from '../cache'

const ONE_HOUR = 60 * 60 * 1000

describe('cache', () => {
  beforeEach(() => {
    clearCache()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns undefined for a missing key', () => {
    expect(getCached('nope')).toBeUndefined()
  })

  it('round-trips a typed value', () => {
    setCached<number[]>('k', [1, 2, 3])
    expect(getCached<number[]>('k')).toEqual([1, 2, 3])
  })

  it('expires an entry after the default 1h TTL', () => {
    jest.useFakeTimers()
    setCached('k', 'v')

    jest.advanceTimersByTime(ONE_HOUR - 1)
    expect(getCached('k')).toBe('v') // still live 1ms before expiry

    jest.advanceTimersByTime(1)
    expect(getCached('k')).toBeUndefined() // expired at exactly the TTL
  })

  it('lazily deletes an expired entry on read', () => {
    jest.useFakeTimers()
    setCached('k', 'v')
    expect(cacheSize()).toBe(1)

    jest.advanceTimersByTime(ONE_HOUR)
    expect(getCached('k')).toBeUndefined()
    expect(cacheSize()).toBe(0) // the read purged it
  })

  it('respects a custom TTL', () => {
    jest.useFakeTimers()
    setCached('k', 'v', 1000)

    jest.advanceTimersByTime(999)
    expect(getCached('k')).toBe('v')

    jest.advanceTimersByTime(1)
    expect(getCached('k')).toBeUndefined()
  })

  it('clearCache empties everything', () => {
    setCached('a', 1)
    setCached('b', 2)
    expect(cacheSize()).toBe(2)

    clearCache()
    expect(getCached('a')).toBeUndefined()
    expect(getCached('b')).toBeUndefined()
    expect(cacheSize()).toBe(0)
  })
})
