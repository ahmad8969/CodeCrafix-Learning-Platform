import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CourseDashboardOverview } from '@/components/dashboard/course-dashboard-overview'
import { AnalyticsCards } from '@/components/enrollment/enrollment-widgets'
import { Button } from '@/components/ui/button'
import { enrollmentService } from '@/services/enrollment.service'
import { ROUTES } from '@/constants'

export default function AdminHomePage() {
  const { data } = useQuery({
    queryKey: ['enrollment-analytics-admin'],
    queryFn: () => enrollmentService.analytics(),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Enrollment overview</h2>
          <p className="text-sm text-muted-foreground">Students, batches, and completion.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`${ROUTES.ADMIN}/enrollments`}>Manage enrollments</Link>
        </Button>
      </div>
      <AnalyticsCards totals={data?.totals || {}} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link to={`${ROUTES.ADMIN}/live-overview`}>Live classes overview</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`${ROUTES.ADMIN}/gamification`}>Certificates & XP</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`${ROUTES.ADMIN}/finance`}>Finance</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`${ROUTES.ADMIN}/messages`}>Messages</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`${ROUTES.ADMIN}/helpdesk`}>Helpdesk</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`${ROUTES.ADMIN}/crm`}>CRM</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`${ROUTES.ADMIN}/career/admin`}>Career</Link>
        </Button>
      </div>
      <CourseDashboardOverview roleLabel="Admin" />
    </div>
  )
}
