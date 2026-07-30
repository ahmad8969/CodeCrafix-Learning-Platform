import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/loaders'
import { certificateService, gamificationService } from '@/services/certificate.service'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

export default function GamificationAdminPage() {
  const { user } = useAuth()
  const role = user?.role
  const base = role === 'super_admin' ? ROUTES.SUPER_ADMIN : ROUTES.ADMIN
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['gamification-admin'],
    queryFn: () => gamificationService.adminDashboard(),
  })

  const { data: pending } = useQuery({
    queryKey: ['cert-pending'],
    queryFn: () => certificateService.pending({ limit: 10 }),
  })

  const seed = useMutation({
    mutationFn: () => gamificationService.seedDefaults(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gamification-admin'] }),
  })

  if (isLoading) return <PageLoader />

  const g = data?.gamification || {}
  const c = data?.certificates || {}

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Certificates & gamification</h1>
          <p className="text-sm text-muted-foreground">Issuance, XP distribution, and top learners.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending}>
            Seed defaults
          </Button>
          <Button variant="outline" asChild>
            <Link to={`${base}/certificate-templates`}>Templates</Link>
          </Button>
          <Button asChild>
            <Link to={`${base}/certificate-rules`}>Rules</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Certificates issued</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold">{c.issued || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending approvals</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold">{c.pending || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total XP awarded</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold">{g.totalXpAwarded || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Learner profiles</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold">{g.studentProfiles || 0}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(g.topStudents || []).map((s, i) => (
              <div key={s._id || i} className="flex justify-between">
                <span>
                  #{i + 1} {s.user?.fullName}
                </span>
                <span className="text-muted-foreground">{s.totalXp} XP</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Certificate requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(pending?.items || []).map((item) => (
              <Link
                key={item._id}
                to={`${base}/certificates/${item._id}`}
                className="flex justify-between hover:text-primary"
              >
                <span>{item.studentName || item.user?.fullName}</span>
                <span className="text-muted-foreground">{item.courseName}</span>
              </Link>
            ))}
            {!pending?.items?.length && (
              <p className="text-muted-foreground">No pending requests</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}

export function TeacherCertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['cert-pending-teacher'],
    queryFn: () => certificateService.pending({ limit: 30 }),
  })
  const { data: board } = useQuery({
    queryKey: ['leaderboard-teacher'],
    queryFn: () => gamificationService.leaderboard({ scope: 'overall', limit: 10 }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <h1 className="text-2xl font-extrabold">Student achievements</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Certificate requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.items || []).map((item) => (
              <Link
                key={item._id}
                to={`${ROUTES.TEACHER}/certificates/${item._id}`}
                className="flex justify-between hover:text-primary"
              >
                <span>{item.studentName || item.user?.fullName}</span>
                <span className="text-muted-foreground">{item.courseName}</span>
              </Link>
            ))}
            {!data?.items?.length && <p className="text-muted-foreground">No pending requests</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(board?.items || []).map((row) => (
              <div key={row.rank} className="flex justify-between">
                <span>
                  #{row.rank} {row.user?.fullName}
                </span>
                <span>{row.value} XP</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
