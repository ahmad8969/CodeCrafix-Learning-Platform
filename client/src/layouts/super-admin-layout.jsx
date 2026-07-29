import { PortalLayout } from '@/layouts/portal-layout'
import { getNavForRole } from '@/constants/navigation'
import { ROLES } from '@/constants'

export function SuperAdminLayout() {
  return (
    <PortalLayout
      title="Super Admin"
      navItems={getNavForRole(ROLES.SUPER_ADMIN)}
      breadcrumbs={[{ label: 'Super Admin' }, { label: 'Portal' }]}
    />
  )
}
