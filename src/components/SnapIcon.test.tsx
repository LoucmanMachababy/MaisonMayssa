import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SnapIcon } from './SnapIcon'

describe('SnapIcon', () => {
  it('rend un SVG', () => {
    const { container } = render(<SnapIcon size={24} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')
  })

  it('a aria-hidden pour l’accessibilité', () => {
    const { container } = render(<SnapIcon />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden')
  })

  it('applique la className si fournie', () => {
    const { container } = render(<SnapIcon className="text-black" />)
    expect(container.querySelector('svg')).toHaveClass('text-black')
  })
})
