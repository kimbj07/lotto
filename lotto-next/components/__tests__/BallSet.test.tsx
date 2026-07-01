import { render, screen } from '@testing-library/react'
import BallSet from '../BallSet'

describe('BallSet', () => {
  it('renders 6 balls and 1 bonus ball', () => {
    render(<BallSet balls={[1, 2, 3, 4, 5, 6]} bonusBall={7} />)
    ;[1, 2, 3, 4, 5, 6, 7].forEach(n => {
      expect(screen.getByText(String(n))).toBeInTheDocument()
    })
  })

  it('renders without bonus ball', () => {
    render(<BallSet balls={[10, 20, 30, 40, 41, 42]} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.queryByText('+')).not.toBeInTheDocument()
  })
})
