// Shared client-side fetch: checks `res.ok` BEFORE trusting the body, and
// tolerates non-JSON bodies (a Vercel 504 is an HTML page — every client used
// to call `res.json()` first and show users "Unexpected token '<'").
export const FETCH_FALLBACK_MESSAGE = '불러오지 못했어요. 잠시 후 다시 시도해 주세요.'

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = init === undefined ? await fetch(url) : await fetch(url, init)
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok || data === null) {
    const msg = (data as { error?: unknown } | null)?.error
    throw new Error(typeof msg === 'string' && msg ? msg : FETCH_FALLBACK_MESSAGE)
  }
  return data as T
}
