import { fetchJson, FETCH_FALLBACK_MESSAGE } from '../fetchJson'

describe('fetchJson', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it('returns the parsed body on 2xx', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ a: 1 }) }) as unknown as typeof fetch
    await expect(fetchJson<{ a: number }>('/x')).resolves.toEqual({ a: 1 })
  })

  it('throws the server error message on a JSON error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'boom' }) }) as unknown as typeof fetch
    await expect(fetchJson('/x')).rejects.toThrow('boom')
  })

  it('falls back to a Korean message when the error body is not JSON (gateway page)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, json: async () => { throw new SyntaxError('Unexpected token <') },
    }) as unknown as typeof fetch
    await expect(fetchJson('/x')).rejects.toThrow(FETCH_FALLBACK_MESSAGE)
  })

  it('never renders the literal "undefined" when an error body lacks .error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch
    await expect(fetchJson('/x')).rejects.toThrow(FETCH_FALLBACK_MESSAGE)
  })
})
