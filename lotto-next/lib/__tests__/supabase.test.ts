describe('supabase client', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('createServerClient returns a client with correct url', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    const { createServerClient } = require('../supabase')
    const client = createServerClient()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe('function')
    expect(typeof client.rpc).toBe('function')
  })
})
