import { render, screen } from '@testing-library/react'
import LottoBall from '../LottoBall'

describe('LottoBall', () => {
  it('renders the number', () => {
    render(<LottoBall number={7} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders bonus ball with isBonus prop', () => {
    render(<LottoBall number={13} isBonus />)
    const el = screen.getByText('13')
    expect(el.closest('[data-bonus]')).toHaveAttribute('data-bonus', 'true')
  })
})
