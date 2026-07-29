import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'

export function AuthPlaceholder({ title, description, children }) {
  return (
    <PageTransition className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md glow-border shadow-elevation-3">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="size-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          <p className="text-center text-xs text-muted-foreground">
            Authentication will be implemented in Prompt 002.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to={ROUTES.HOME}>Back to landing</Link>
          </Button>
        </CardContent>
      </Card>
    </PageTransition>
  )
}
