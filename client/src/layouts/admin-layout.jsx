import { LayoutDashboard, Users, Shield } from 'lucide-react'
import { PortalLayout } from '@/layouts/portal-layout'
import { ROUTES } from '@/constants'

const navItems = [
  { to: ROUTES.ADMIN, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: `${ROUTES.ADMIN}/users`, label: 'Users', icon: Users },
  { to: `${ROUTES.ADMIN}/system`, label: 'System', icon: Shield },
]

export function AdminLayout() {
  return (
    <PortalLayout
      title="Admin Portal"
      navItems={navItems}
      breadcrumbs={[{ label: 'Admin' }, { label: 'Portal' }]}
    />
  )
}
