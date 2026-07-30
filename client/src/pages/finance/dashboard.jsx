import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/loaders'
import { financeService } from '@/services/finance.service'
import {
  FinanceStatCards,
  RevenueChart,
  money,
} from '@/components/finance/finance-widgets'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

export default function FinanceDashboardPage() {
  const { user } = useAuth()
  const base = user?.role === 'super_admin' ? ROUTES.SUPER_ADMIN : ROUTES.ADMIN
  const { data, isLoading } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: () => financeService.dashboard(),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Institute ERP</p>
          <h1 className="text-2xl font-extrabold">Finance dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to={`${base}/finance/admissions`}>Admissions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`${base}/finance/fee-plans`}>Fee plans</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`${base}/finance/expenses`}>Expenses</Link>
          </Button>
          <Button asChild>
            <Link to={`${base}/finance/reports`}>Reports</Link>
          </Button>
        </div>
      </div>

      <FinanceStatCards data={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart items={data?.chart?.incomeVsExpense || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by course</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart
              items={(data?.revenueByCourse || []).map((r) => ({
                label: r.title,
                value: r.total,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data?.recentPayments || []).map((p) => (
            <div key={p._id} className="flex justify-between gap-2">
              <span>
                {p.student?.fullName} · {p.course?.title}
              </span>
              <span className="font-medium">{money(p.amount, p.currency)}</span>
            </div>
          ))}
          {!data?.recentPayments?.length && (
            <p className="text-muted-foreground">No payments yet</p>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
