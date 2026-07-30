import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/common/empty-state'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No tickets" description="Create your first support ticket." />)
    expect(screen.getByText('No tickets')).toBeInTheDocument()
    expect(screen.getByText('Create your first support ticket.')).toBeInTheDocument()
  })
})
