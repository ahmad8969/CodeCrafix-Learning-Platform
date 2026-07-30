import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { certificateService } from '@/services/certificate.service'
import { CertificateCard } from '@/components/certificates/certificate-widgets'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

export default function CertificatesListPage() {
  const { user } = useAuth()
  const role = user?.role
  const base =
    role === 'student'
      ? ROUTES.STUDENT
      : role === 'teacher'
        ? ROUTES.TEACHER
        : role === 'super_admin'
          ? ROUTES.SUPER_ADMIN
          : ROUTES.ADMIN

  const { data, isLoading } = useQuery({
    queryKey: ['certificates', role],
    queryFn: () => certificateService.list({ limit: 50 }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Achievements</p>
          <h1 className="text-2xl font-extrabold">Certificates</h1>
        </div>
        {role !== 'student' && (
          <Button variant="outline" asChild>
            <Link to={`${base}/certificate-templates`}>Templates</Link>
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.items || []).map((c) => (
          <CertificateCard key={c._id} item={c} href={`${base}/certificates/${c._id}`} />
        ))}
        {!data?.items?.length && (
          <p className="text-sm text-muted-foreground">No certificates yet.</p>
        )}
      </div>
    </PageTransition>
  )
}
