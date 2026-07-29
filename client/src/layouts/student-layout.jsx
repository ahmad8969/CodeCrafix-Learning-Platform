import { LayoutDashboard, BookOpen, ClipboardList } from 'lucide-react'
import { PortalLayout } from '@/layouts/portal-layout'
import { ROUTES } from '@/constants'

const navItems = [
  { to: ROUTES.STUDENT, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: `${ROUTES.STUDENT}/courses`, label: 'Courses', icon: BookOpen },
  { to: `${ROUTES.STUDENT}/assignments`, label: 'Assignments', icon: ClipboardList },
]

export function StudentLayout() {
  return (
    <PortalLayout
      title="Student Portal"
      navItems={navItems}
      breadcrumbs={[{ label: 'Student' }, { label: 'Portal' }]}
    />
  )
}
