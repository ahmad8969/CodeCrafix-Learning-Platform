import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/loaders'
import { financeService } from '@/services/finance.service'
import { ExpenseTable, money } from '@/components/finance/finance-widgets'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

export default function ExpensesPage() {
  const { user } = useAuth()
  const base = user?.role === 'super_admin' ? ROUTES.SUPER_ADMIN : ROUTES.ADMIN
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'miscellaneous',
    vendor: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => financeService.listExpenses({ limit: 100 }),
  })
  const { data: income } = useQuery({
    queryKey: ['income'],
    queryFn: () => financeService.listIncome({ limit: 50 }),
  })

  const create = useMutation({
    mutationFn: () =>
      financeService.createExpense({ ...form, amount: Number(form.amount) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      setForm({ title: '', amount: '', category: 'miscellaneous', vendor: '' })
    },
  })
  const remove = useMutation({
    mutationFn: (id) => financeService.deleteExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Expenses & income</h1>
        </div>
        <Button variant="outline" asChild>
          <Link to={`${base}/finance`}>Dashboard</Link>
        </Button>
      </div>

      <form
        className="grid gap-2 rounded-2xl border border-border p-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
      >
        <input
          required
          placeholder="Title"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          required
          type="number"
          placeholder="Amount"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <select
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {[
            'rent',
            'electricity',
            'internet',
            'salaries',
            'marketing',
            'stationery',
            'equipment',
            'miscellaneous',
          ].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button type="submit">Add expense</Button>
      </form>

      <ExpenseTable items={data?.items || []} onDelete={(id) => remove.mutate(id)} />

      <Card>
        <CardHeader>
          <CardTitle>Recent income</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(income?.items || []).map((i) => (
            <div key={i._id} className="flex justify-between">
              <span>
                {i.title} · {i.category}
              </span>
              <span className="font-medium text-emerald-600">{money(i.amount, i.currency)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTransition>
  )
}

export function FinanceReportsPage() {
  const { user } = useAuth()
  const base = user?.role === 'super_admin' ? ROUTES.SUPER_ADMIN : ROUTES.ADMIN
  const { data: outstanding, isLoading } = useQuery({
    queryKey: ['report-outstanding'],
    queryFn: () => financeService.reportOutstanding(),
  })
  const { data: pnl } = useQuery({
    queryKey: ['report-pnl'],
    queryFn: () => financeService.reportPnL(),
  })
  const { data: daily } = useQuery({
    queryKey: ['report-daily'],
    queryFn: () => financeService.reportDaily(),
  })
  const { data: monthly } = useQuery({
    queryKey: ['report-monthly'],
    queryFn: () => financeService.reportMonthly(),
  })

  const download = async (type) => {
    const blob = await financeService.exportReport(type, 'csv')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Financial reports</h1>
          <p className="text-sm text-muted-foreground">CSV/Excel export; PDF architecture-ready.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => download('outstanding')}>
            Export outstanding
          </Button>
          <Button variant="outline" onClick={() => download('expenses')}>
            Export expenses
          </Button>
          <Button variant="outline" onClick={() => download('daily')}>
            Export daily
          </Button>
          <Button variant="outline" asChild>
            <Link to={`${base}/finance`}>Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily collection</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-extrabold">{money(daily?.total)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-extrabold">{money(monthly?.income)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">P&amp;L profit</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-extrabold">{money(pnl?.profit)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-extrabold">{money(outstanding?.total)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding fee report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(outstanding?.items || []).slice(0, 30).map((a) => (
            <div key={a._id} className="flex justify-between gap-2">
              <span>
                {a.student?.fullName} · {a.course?.title}
              </span>
              <span>
                {money(a.remainingAmount, a.currency)}
                {(a.overdueAmount || 0) > 0 ? ` (overdue ${a.overdueAmount})` : ''}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTransition>
  )
}

export function TeacherFeeStatusPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-fee-status'],
    queryFn: () => financeService.teacherStatus(),
  })
  if (isLoading) return <PageLoader />
  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Student payment status</h1>
        <p className="text-sm text-muted-foreground">Read-only view of fee defaulters.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Defaulters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data?.defaulters || []).map((a) => (
            <div key={a._id} className="flex justify-between">
              <span>
                {a.student?.fullName} · {a.course?.title}
              </span>
              <span className="text-destructive">{money(a.overdueAmount || a.remainingAmount)}</span>
            </div>
          ))}
          {!data?.defaulters?.length && (
            <p className="text-muted-foreground">No overdue students</p>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
