import { WifiOff } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <PageTransition className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
        <WifiOff className="size-7" />
      </div>
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="max-w-md text-muted-foreground">
        Check your internet connection, then try again.
      </p>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </PageTransition>
  )
}
