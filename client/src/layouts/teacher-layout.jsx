import { PortalLayout } from '@/layouts/portal-layout'
import { getNavForRole } from '@/constants/navigation'
import { ROLES } from '@/constants'

export function TeacherLayout() {
  return (
    <PortalLayout
      title="Teacher Portal"
      navItems={getNavForRole(ROLES.TEACHER)}
      breadcrumbs={[{ label: 'Teacher' }, { label: 'Portal' }]}
    />
  )
}
