import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTransition } from '@/components/ui/motion'
import { APP_NAME } from '@/constants'

export function LoginCard({ title, description, children, footer }) {
  return (
    <PageTransition className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md glow-border shadow-elevation-3">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="size-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold">{title || APP_NAME}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {footer}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
