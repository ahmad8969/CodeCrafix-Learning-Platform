import { LayoutDashboard, Users, ClipboardList } from 'lucide-react'
import { PortalLayout } from '@/layouts/portal-layout'
import { ROUTES } from '@/constants'

const navItems = [
  { to: ROUTES.TEACHER, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: `${ROUTES.TEACHER}/classes`, label: 'Classes', icon: Users },
  { to: `${ROUTES.TEACHER}/reviews`, label: 'Reviews', icon: ClipboardList },
]

export function TeacherLayout() {
  return (
    <PortalLayout
      title="Teacher Portal"
      navItems={navItems}
      breadcrumbs={[{ label: 'Teacher' }, { label: 'Portal' }]}
    />
  )
}
