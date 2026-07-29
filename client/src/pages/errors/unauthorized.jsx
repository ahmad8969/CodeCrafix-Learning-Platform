import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'

export default function UnauthorizedPage() {
  return (
    <PageTransition className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" />
      </div>
      <h1 className="text-2xl font-bold">Unauthorized</h1>
      <p className="max-w-md text-muted-foreground">
        You do not have permission to view this page. Sign in with the correct account or contact an admin.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link to={ROUTES.LOGIN}>Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.HOME}>Home</Link>
        </Button>
      </div>
    </PageTransition>
  )
}
