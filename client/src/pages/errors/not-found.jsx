import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'

function ErrorShell({ code, title, description }) {
  return (
    <PageTransition className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-gradient text-6xl font-extrabold tracking-tight sm:text-7xl">{code}</p>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="max-w-md text-muted-foreground">{description}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to={ROUTES.HOME}>Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.LOGIN}>Sign in</Link>
        </Button>
      </div>
    </PageTransition>
  )
}

export default function NotFoundPage() {
  return (
    <ErrorShell
      code="404"
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
    />
  )
}
