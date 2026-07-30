import { Component } from 'react'
import { Button } from '@/components/ui/button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected application error' }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary', error, info)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{this.state.message}</p>
        <Button
          onClick={() => {
            this.setState({ hasError: false, message: '' })
            window.location.assign('/')
          }}
        >
          Return home
        </Button>
      </div>
    )
  }
}
