import { render, screen, fireEvent } from '@testing-library/react'
import SelectableNumberGrid from '../SelectableNumberGrid'

function grid(props: Partial<React.ComponentProps<typeof SelectableNumberGrid>> = {}) {
  const onToggle = jest.fn()
  render(<SelectableNumberGrid selected={[]} onToggle={onToggle} max={5} {...props} />)
  return { onToggle }
}

it('toggles an unselected number', () => {
  const { onToggle } = grid()
  fireEvent.click(screen.getByRole('button', { name: '7' }))
  expect(onToggle).toHaveBeenCalledWith(7)
})

it('lets a selected number toggle off even at max', () => {
  const onToggle = jest.fn()
  render(<SelectableNumberGrid selected={[1, 2, 3, 4, 5]} onToggle={onToggle} max={5} />)
  fireEvent.click(screen.getByRole('button', { name: '3' }))
  expect(onToggle).toHaveBeenCalledWith(3)
})

it('does not toggle an unselected number once at max', () => {
  const onToggle = jest.fn()
  render(<SelectableNumberGrid selected={[1, 2, 3, 4, 5]} onToggle={onToggle} max={5} />)
  fireEvent.click(screen.getByRole('button', { name: '9' }))
  expect(onToggle).not.toHaveBeenCalled()
})

it('does not toggle a disabled number', () => {
  const onToggle = jest.fn()
  render(<SelectableNumberGrid selected={[]} onToggle={onToggle} max={5} disabled={[9]} />)
  fireEvent.click(screen.getByRole('button', { name: '9' }))
  expect(onToggle).not.toHaveBeenCalled()
})
