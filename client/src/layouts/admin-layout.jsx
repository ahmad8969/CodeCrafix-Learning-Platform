import { PortalLayout } from '@/layouts/portal-layout'
import { getNavForRole } from '@/constants/navigation'
import { ROLES } from '@/constants'

export function AdminLayout() {
  return (
    <PortalLayout
      title="Admin Portal"
      navItems={getNavForRole(ROLES.ADMIN)}
      breadcrumbs={[{ label: 'Admin' }, { label: 'Portal' }]}
    />
  )
}
