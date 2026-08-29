import { NextResponse } from 'next/server'

// Client-facing error contract for DB/upstream failures: a fixed Korean
// message + a short code. The raw PostgREST/Postgres text (column and function
// names, hints) is logged server-side only — it used to be returned verbatim
// from nine call sites and rendered straight into the UI.
export const GENERIC_ERROR = '데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'

export function serverError(context: string, detail: string, status = 500) {
  console.error(`[api] ${context}: ${detail}`)
  return NextResponse.json({ error: GENERIC_ERROR, code: context }, { status })
}
