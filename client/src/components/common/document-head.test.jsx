import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { DocumentHead } from '@/components/common/document-head'

describe('DocumentHead', () => {
  it('updates document title and robots meta', () => {
    render(<DocumentHead title="Security" robots="noindex,nofollow" />)
    expect(document.title).toContain('Security')
    const robots = document.head.querySelector('meta[name="robots"]')
    expect(robots?.getAttribute('content')).toBe('noindex,nofollow')
  })
})
