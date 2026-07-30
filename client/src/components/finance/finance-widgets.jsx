import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function money(amount, currency = 'PKR') {
  const n = Number(amount) || 0
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function FeeCard({ account, href }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge>{account.status}</Badge>
        {(account.overdueAmount || 0) > 0 && <Badge variant="danger">Overdue</Badge>}
      </div>
      {href ? (
        <Link to={href} className="text-lg font-semibold hover:text-primary">
          {account.course?.title || 'Fee account'}
        </Link>
      ) : (
        <h3 className="text-lg font-semibold">{account.course?.title || 'Fee account'}</h3>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{account.batch?.name || account.batch?.batchCode}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-semibold">{money(account.totalFee, account.currency)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="font-semibold text-emerald-600">{money(account.paidAmount, account.currency)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Remaining</dt>
          <dd className="font-semibold">{money(account.remainingAmount, account.currency)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Next due</dt>
          <dd>
            {account.nextDueDate ? new Date(account.nextDueDate).toLocaleDateString() : '—'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

export function DiscountCard({ rule }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex gap-2">
        <Badge variant="secondary">{rule.type}</Badge>
        {rule.active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}
      </div>
      <h3 className="font-semibold">{rule.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
      <p className="mt-2 text-lg font-bold text-teal-700 dark:text-teal-300">
        {rule.type === 'percentage' ||
        rule.type === 'early_bird' ||
        rule.type === 'staff' ||
        rule.type === 'sibling'
          ? `${rule.value}%`
          : money(rule.value)}
      </p>
    </div>
  )
}

export function LedgerTable({ entries = [] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Note</th>
            <th className="px-3 py-2 font-medium text-right">Amount</th>
            <th className="px-3 py-2 font-medium text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e._id || `${e.at}-${e.type}`} className="border-t border-border">
              <td className="px-3 py-2 whitespace-nowrap">
                {e.at ? new Date(e.at).toLocaleString() : '—'}
              </td>
              <td className="px-3 py-2">
                <Badge variant="outline">{e.type}</Badge>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{e.note}</td>
              <td
                className={cn(
                  'px-3 py-2 text-right font-medium',
                  e.amount < 0 ? 'text-emerald-600' : ''
                )}
              >
                {e.amount}
              </td>
              <td className="px-3 py-2 text-right">{e.balanceAfter}</td>
            </tr>
          ))}
          {!entries.length && (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                No ledger entries
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function StudentLedgerTimeline({ entries = [] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {entries.map((e, i) => (
        <li key={e._id || i} className="relative">
          <span className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full bg-teal-600" />
          <p className="text-sm font-medium">
            {e.type}: {e.amount}
          </p>
          <p className="text-xs text-muted-foreground">
            {e.at ? new Date(e.at).toLocaleString() : ''} · {e.note}
          </p>
        </li>
      ))}
    </ol>
  )
}

export function PaymentDialog({ open, onClose, onSubmit, loading, defaultAmount }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-background p-5 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          onSubmit?.({
            amount: Number(fd.get('amount')),
            method: fd.get('method'),
            reference: fd.get('reference'),
            notes: fd.get('notes'),
            forcePaid: true,
          })
        }}
      >
        <h3 className="text-lg font-bold">Record payment</h3>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Amount</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            defaultValue={defaultAmount || ''}
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Method</span>
          <select
            name="method"
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            defaultValue="cash"
          >
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="jazzcash">JazzCash (ready)</option>
            <option value="easypaisa">EasyPaisa (ready)</option>
            <option value="card">Card (ready)</option>
            <option value="stripe">Stripe (ready)</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Reference</span>
          <input
            name="reference"
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Notes</span>
          <textarea
            name="notes"
            className="min-h-16 w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            Save payment
          </Button>
        </div>
      </form>
    </div>
  )
}

export function ReceiptViewer({ receipt }) {
  if (!receipt) return null
  const qr = receipt.qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(receipt.qrPayload)}`
    : null
  return (
    <div className="rounded-3xl border-2 border-teal-700/40 bg-white p-8 text-slate-900 print:border-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-700">CodeCrafters</p>
          <h2 className="text-2xl font-bold">{receipt.type} receipt</h2>
          <p className="font-mono text-sm text-slate-500">{receipt.receiptNumber}</p>
        </div>
        {qr && <img src={qr} alt="QR" className="size-[100px]" />}
      </div>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-slate-500">Student</dt>
          <dd className="font-semibold">{receipt.student?.fullName || receipt.snapshot?.studentName}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Course</dt>
          <dd className="font-semibold">{receipt.course?.title}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Batch</dt>
          <dd>{receipt.batch?.name || receipt.batch?.batchCode || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Amount</dt>
          <dd className="text-lg font-bold text-teal-800">
            {money(receipt.amount, receipt.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Issued</dt>
          <dd>{receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleString() : '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Method</dt>
          <dd>{receipt.snapshot?.method || receipt.payment?.method || '—'}</dd>
        </div>
      </dl>
      <div className="mt-10 flex justify-between border-t border-slate-200 pt-6 text-sm">
        <div>
          <p className="text-slate-500">Authorized signature</p>
          <div className="mt-8 w-40 border-b border-slate-400" />
        </div>
        <Button type="button" variant="outline" className="print:hidden" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </div>
  )
}

export function ExpenseTable({ items = [], onDelete }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2 text-right">Amount</th>
            {onDelete && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e._id} className="border-t border-border">
              <td className="px-3 py-2">
                {e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : '—'}
              </td>
              <td className="px-3 py-2">
                <Badge variant="secondary">{e.category}</Badge>
              </td>
              <td className="px-3 py-2">{e.title}</td>
              <td className="px-3 py-2 text-right font-medium">{money(e.amount, e.currency)}</td>
              {onDelete && (
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => onDelete(e._id)}>
                    Delete
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RevenueChart({ items = [] }) {
  const max = Math.max(...items.map((i) => Math.abs(i.value) || 0), 1)
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{item.label}</span>
            <span className="font-medium">{money(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500"
              style={{ width: `${Math.min(100, (Math.abs(item.value) / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
      {!items.length && <p className="text-sm text-muted-foreground">No chart data</p>}
    </div>
  )
}

export function FinanceStatCards({ data }) {
  if (!data) return null
  const cards = [
    { label: "Today's income", value: money(data.todayIncome) },
    { label: 'Monthly income', value: money(data.monthlyIncome) },
    { label: 'Monthly expenses', value: money(data.monthlyExpenses) },
    { label: 'Profit', value: money(data.profit) },
    { label: 'Outstanding', value: money(data.outstandingFees) },
    { label: 'Overdue students', value: data.overdueStudents },
    { label: 'Collection rate', value: `${data.collectionRate}%` },
    { label: 'Pending admissions', value: data.pendingAdmissions },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{c.label}</p>
          <p className="mt-1 text-2xl font-extrabold">{c.value}</p>
        </div>
      ))}
    </div>
  )
}
