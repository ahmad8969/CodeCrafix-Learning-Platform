import { PageTransition } from '@/components/ui/motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PortalPlaceholder({ role, title, description }) {
  return (
    <PageTransition className="space-y-6">
      <div>
        <Badge variant="secondary" className="mb-2 capitalize">
          {role} portal
        </Badge>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foundation placeholder</CardTitle>
          <CardDescription>
            Business modules are intentionally empty in Prompt 001. Dashboards and features arrive in later prompts.
          </CardDescription>
        </CardHeader>
        <CardContent className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          No business logic here yet.
        </CardContent>
      </Card>
    </PageTransition>
  )
}
