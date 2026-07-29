import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/ui/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { useTheme } from '@/contexts/theme-context'
import { useAuth } from '@/contexts/auth-context'
import { ROLE_LABELS, ROUTES, getHomePathForRole } from '@/constants'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <Breadcrumb
        items={[
          { label: 'Portal', href: getHomePathForRole(user?.role) },
          { label: 'Settings' },
        ]}
      />
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name: </span>
            {user?.fullName}
          </p>
          <p>
            <span className="text-muted-foreground">Email: </span>
            {user?.email}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Role:</span>
            <Badge variant="primary" className="capitalize">
              {ROLE_LABELS[user?.role] || user?.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant={theme === 'dark' ? 'primary' : 'outline'} onClick={() => setTheme('dark')}>
            Dark
          </Button>
          <Button variant={theme === 'light' ? 'primary' : 'outline'} onClick={() => setTheme('light')}>
            Light
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to={ROUTES.CHANGE_PASSWORD}>Change password</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to={getHomePathForRole(user?.role)}>Back to portal</Link>
        </Button>
      </div>
    </PageTransition>
  )
}
