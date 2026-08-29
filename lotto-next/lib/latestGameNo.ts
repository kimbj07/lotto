// The one way to read "latest draw in the DB". Every caller used to do
// `const { data } = await …single()` and fall back to 0 when `data` was
// missing — which turned a transient Supabase error into, variously, a
// 1→1230 re-sync stampede (sync), picks recorded against draw #1 (recommend),
// and a silent full-table scan (history). This surfaces the error instead.

// Minimal shape of the supabase-js query chain we use (keeps this helper
// independent of the client type and trivially mockable in tests).
interface GameInfoReader {
  from: (table: string) => {
    select: (cols: string) => {
      order: (col: string, opts: { ascending: boolean }) => {
        limit: (n: number) => {
          single: () => PromiseLike<{
            data: { game_no?: number } | null
            error: { code?: string; message: string } | null
          }>
        }
      }
    }
  }
}

export type LatestGameNo =
  | { ok: true; gameNo: number }       // gameNo is 0 only when the table is empty
  | { ok: false; error: string }

// PostgREST returns this code for `.single()` on zero rows — an empty table,
// which is legitimate (fresh DB), not a failure.
const NO_ROWS = 'PGRST116'

export async function getLatestGameNo(client: GameInfoReader): Promise<LatestGameNo> {
  const { data, error } = await client
    .from('game_info')
    .select('game_no')
    .order('game_no', { ascending: false })
    .limit(1)
    .single()
  if (error && error.code !== NO_ROWS) return { ok: false, error: error.message }
  return { ok: true, gameNo: data?.game_no ?? 0 }
}
