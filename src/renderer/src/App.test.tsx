import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the four MVP category cards in Chinese by default', () => {
    render(<App />)

    expect(screen.getByText(/开发者缓存|Developer/)).toBeInTheDocument()
    expect(screen.getByText(/浏览器缓存|Browsers/)).toBeInTheDocument()
    expect(screen.getByText(/应用更新残留|App Updates/)).toBeInTheDocument()
    expect(screen.getByText(/Docker/)).toBeInTheDocument()
  })

  it('switches the category labels to English when the EN chip is clicked', () => {
    render(<App />)

    fireEvent.click(screen.getByText('EN'))

    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByText('Browsers')).toBeInTheDocument()
  })
})
