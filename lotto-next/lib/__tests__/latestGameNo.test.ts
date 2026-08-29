import { getLatestGameNo } from '../latestGameNo'

function client(result: { data: { game_no?: number } | null; error: { code?: string; message: string } | null }) {
  return {
    from: () => ({
      select: () => ({ order: () => ({ limit: () => ({ single: async () => result }) }) }),
    }),
  }
}

describe('getLatestGameNo', () => {
  it('returns the latest game_no', async () => {
    expect(await getLatestGameNo(client({ data: { game_no: 1230 }, error: null }))).toEqual({ ok: true, gameNo: 1230 })
  })

  it('treats an empty table (PGRST116) as game 0, not an error', async () => {
    const r = await getLatestGameNo(client({ data: null, error: { code: 'PGRST116', message: 'no rows' } }))
    expect(r).toEqual({ ok: true, gameNo: 0 })
  })

  it('surfaces any other error instead of falling back to 0', async () => {
    const r = await getLatestGameNo(client({ data: null, error: { code: '08006', message: 'connection failure' } }))
    expect(r).toEqual({ ok: false, error: 'connection failure' })
  })
})
