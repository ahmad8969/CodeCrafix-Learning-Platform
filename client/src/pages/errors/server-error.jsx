import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'

export default function ServerErrorPage() {
  return (
    <PageTransition className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-gradient text-6xl font-extrabold tracking-tight sm:text-7xl">500</p>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        An unexpected server error occurred. Please try again in a moment.
      </p>
      <Button asChild>
        <Link to={ROUTES.HOME}>Go home</Link>
      </Button>
    </PageTransition>
  )
}
