import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { certificateService } from '@/services/certificate.service'
import { CertificateViewer } from '@/components/certificates/certificate-widgets'
import { useAuth } from '@/contexts/auth-context'
import { ROUTES } from '@/constants'

export default function CertificateDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const role = user?.role
  const qc = useQueryClient()
  const base =
    role === 'student'
      ? ROUTES.STUDENT
      : role === 'teacher'
        ? ROUTES.TEACHER
        : ROUTES.ADMIN

  const { data, isLoading } = useQuery({
    queryKey: ['certificate', id],
    queryFn: () => certificateService.get(id),
  })

  const approve = useMutation({
    mutationFn: () => certificateService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificate', id] }),
  })

  if (isLoading) return <PageLoader />
  if (!data) return <p>Not found</p>

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Button variant="ghost" asChild className="mb-2 px-0">
            <Link to={`${base}/certificates`}>← Back</Link>
          </Button>
          <h1 className="text-2xl font-extrabold">{data.courseName}</h1>
          <p className="font-mono text-sm text-muted-foreground">{data.certificateNumber}</p>
        </div>
        <div className="flex gap-2">
          {data.verificationUrl && (
            <Button variant="outline" asChild>
              <a href={data.verificationUrl} target="_blank" rel="noreferrer">
                Public verify link
              </a>
            </Button>
          )}
          {data.status === 'pending_approval' && ['teacher', 'admin', 'super_admin'].includes(role) && (
            <Button onClick={() => approve.mutate()} disabled={approve.isPending}>
              Approve
            </Button>
          )}
        </div>
      </div>
      <CertificateViewer certificate={data} />
    </PageTransition>
  )
}
