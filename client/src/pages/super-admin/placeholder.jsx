import { PortalPlaceholder } from '@/pages/_shared/portal-placeholder'

export default function SuperAdminPlaceholderPage({ title = 'Module' }) {
  return (
    <PortalPlaceholder
      role="super admin"
      title={title}
      description="Placeholder module — not implemented in Prompt 002."
    />
  )
}
