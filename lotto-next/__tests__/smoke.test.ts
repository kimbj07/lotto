describe('smoke test', () => {
  it('runs in jsdom environment', () => {
    expect(typeof window).toBe('object')
  })
})
