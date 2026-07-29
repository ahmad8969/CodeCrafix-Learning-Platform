import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/ui/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { useTheme } from '@/contexts/theme-context'
import { ROUTES } from '@/constants'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <Breadcrumb items={[{ label: 'Home', href: ROUTES.HOME }, { label: 'Settings' }]} />
      <h1 className="text-2xl font-extrabold">Settings</h1>
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
      <Button asChild variant="outline">
        <Link to={ROUTES.HOME}>Back to landing</Link>
      </Button>
    </PageTransition>
  )
}
