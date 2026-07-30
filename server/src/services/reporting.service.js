const {
  Income,
  Expense,
  StudentFeeAccount,
  Payment,
  Admission,
} = require('../models/Finance')
const { PAYMENT_STATUS, ADMISSION_STATUS } = require('../constants/finance')

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

async function sumIncome(from, to) {
  const match = {}
  if (from || to) {
    match.incomeDate = {}
    if (from) match.incomeDate.$gte = from
    if (to) match.incomeDate.$lte = to
  }
  const rows = await Income.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])
  return rows[0]?.total || 0
}

async function sumExpenses(from, to) {
  const match = {}
  if (from || to) {
    match.expenseDate = {}
    if (from) match.expenseDate.$gte = from
    if (to) match.expenseDate.$lte = to
  }
  const rows = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])
  return rows[0]?.total || 0
}

async function dashboard() {
  const today = startOfDay()
  const month = startOfMonth()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    todayIncome,
    monthlyIncome,
    monthlyExpenses,
    outstanding,
    overdueAccounts,
    paidPayments,
    totalAccounts,
    revenueByCourse,
    revenueByBatch,
    recentPayments,
    pendingAdmissions,
  ] = await Promise.all([
    sumIncome(today, tomorrow),
    sumIncome(month, new Date()),
    sumExpenses(month, new Date()),
    StudentFeeAccount.aggregate([
      { $match: { status: { $in: ['active', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' }, overdue: { $sum: '$overdueAmount' } } },
    ]),
    StudentFeeAccount.countDocuments({ status: 'overdue' }),
    Payment.countDocuments({ status: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIAL] } }),
    StudentFeeAccount.countDocuments(),
    Payment.aggregate([
      { $match: { status: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIAL] } } },
      { $group: { _id: '$course', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
    Payment.aggregate([
      { $match: { status: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIAL] }, batch: { $ne: null } } },
      { $group: { _id: '$batch', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
    Payment.find({ status: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIAL] } })
      .sort({ paidAt: -1 })
      .limit(8)
      .populate('student', 'fullName')
      .populate('course', 'title')
      .lean(),
    Admission.countDocuments({ status: ADMISSION_STATUS.PENDING }),
  ])

  const out = outstanding[0] || { total: 0, overdue: 0 }
  const billed = await StudentFeeAccount.aggregate([
    { $group: { _id: null, total: { $sum: '$totalFee' }, paid: { $sum: '$paidAmount' } } },
  ])
  const billedTotal = billed[0]?.total || 0
  const paidTotal = billed[0]?.paid || 0
  const collectionRate = billedTotal > 0 ? Math.round((paidTotal / billedTotal) * 1000) / 10 : 0

  const Course = require('../models/Course')
  const Batch = require('../models/Batch')
  const courseIds = revenueByCourse.map((r) => r._id).filter(Boolean)
  const batchIds = revenueByBatch.map((r) => r._id).filter(Boolean)
  const [courses, batches] = await Promise.all([
    Course.find({ _id: { $in: courseIds } }).select('title').lean(),
    Batch.find({ _id: { $in: batchIds } }).select('name batchCode').lean(),
  ])
  const courseMap = Object.fromEntries(courses.map((c) => [String(c._id), c.title]))
  const batchMap = Object.fromEntries(
    batches.map((b) => [String(b._id), b.name || b.batchCode])
  )

  return {
    todayIncome,
    monthlyIncome,
    monthlyExpenses,
    profit: monthlyIncome - monthlyExpenses,
    outstandingFees: out.total || 0,
    overdueAmount: out.overdue || 0,
    overdueStudents: overdueAccounts,
    collectionRate,
    paidPayments,
    totalAccounts,
    pendingAdmissions,
    revenueByCourse: revenueByCourse.map((r) => ({
      courseId: r._id,
      title: courseMap[String(r._id)] || '—',
      total: r.total,
    })),
    revenueByBatch: revenueByBatch.map((r) => ({
      batchId: r._id,
      title: batchMap[String(r._id)] || '—',
      total: r.total,
    })),
    recentPayments,
    chart: {
      incomeVsExpense: [
        { label: 'Income', value: monthlyIncome },
        { label: 'Expenses', value: monthlyExpenses },
        { label: 'Profit', value: monthlyIncome - monthlyExpenses },
      ],
    },
  }
}

async function dailyCollection(date = new Date()) {
  const from = startOfDay(date)
  const to = new Date(from)
  to.setDate(to.getDate() + 1)
  const payments = await Payment.find({
    status: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIAL] },
    paidAt: { $gte: from, $lt: to },
  })
    .populate('student', 'fullName')
    .populate('course', 'title')
    .lean()
  const total = payments.reduce((s, p) => s + (p.amount || 0), 0)
  return { date: from, total, count: payments.length, payments }
}

async function monthlyRevenue(year, month) {
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 1)
  const income = await sumIncome(from, to)
  const expenses = await sumExpenses(from, to)
  const byCategory = await Income.aggregate([
    { $match: { incomeDate: { $gte: from, $lt: to } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ])
  return { year, month, income, expenses, profit: income - expenses, byCategory }
}

async function outstandingReport() {
  const items = await StudentFeeAccount.find({
    remainingAmount: { $gt: 0 },
    status: { $in: ['active', 'overdue'] },
  })
    .populate('student', 'fullName email phoneNumber')
    .populate('course', 'title')
    .populate('batch', 'name batchCode')
    .sort({ overdueAmount: -1, remainingAmount: -1 })
    .lean()
  const total = items.reduce((s, i) => s + (i.remainingAmount || 0), 0)
  return { total, count: items.length, items }
}

async function expenseReport(filters = {}) {
  const data = await require('./finance.service').listExpenses({ ...filters, limit: 500 })
  const total = (data.items || []).reduce((s, i) => s + (i.amount || 0), 0)
  const byCategory = {}
  for (const i of data.items || []) {
    byCategory[i.category] = (byCategory[i.category] || 0) + i.amount
  }
  return { total, byCategory, items: data.items }
}

async function profitAndLoss({ from, to } = {}) {
  const start = from ? new Date(from) : startOfMonth()
  const end = to ? new Date(to) : new Date()
  const income = await sumIncome(start, end)
  const expenses = await sumExpenses(start, end)
  return {
    from: start,
    to: end,
    income,
    expenses,
    profit: income - expenses,
  }
}

function toCsv(rows, columns) {
  const header = columns.map((c) => c.label).join(',')
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor]
        const str = val == null ? '' : String(val)
        return `"${str.replace(/"/g, '""')}"`
      })
      .join(',')
  )
  return [header, ...lines].join('\n')
}

async function exportReport(type, format = 'csv', filters = {}) {
  let rows = []
  let columns = []
  if (type === 'outstanding') {
    const data = await outstandingReport()
    rows = data.items
    columns = [
      { label: 'Student', accessor: (r) => r.student?.fullName },
      { label: 'Course', accessor: (r) => r.course?.title },
      { label: 'Remaining', accessor: 'remainingAmount' },
      { label: 'Overdue', accessor: 'overdueAmount' },
      { label: 'Status', accessor: 'status' },
    ]
  } else if (type === 'expenses') {
    const data = await expenseReport(filters)
    rows = data.items
    columns = [
      { label: 'Date', accessor: (r) => r.expenseDate },
      { label: 'Category', accessor: 'category' },
      { label: 'Title', accessor: 'title' },
      { label: 'Amount', accessor: 'amount' },
    ]
  } else if (type === 'daily') {
    const data = await dailyCollection(filters.date ? new Date(filters.date) : new Date())
    rows = data.payments
    columns = [
      { label: 'Student', accessor: (r) => r.student?.fullName },
      { label: 'Course', accessor: (r) => r.course?.title },
      { label: 'Amount', accessor: 'amount' },
      { label: 'Method', accessor: 'method' },
    ]
  } else {
    throw new Error('Unsupported report type')
  }

  if (format === 'excel' || format === 'csv') {
    return {
      contentType: 'text/csv',
      filename: `${type}-report.csv`,
      body: toCsv(rows, columns),
      pdfArchitectureReady: true,
    }
  }
  // PDF architecture ready
  return {
    contentType: 'application/json',
    filename: `${type}-report.json`,
    body: JSON.stringify({ rows, pdfArchitectureReady: true }, null, 2),
    pdfArchitectureReady: true,
  }
}

module.exports = {
  dashboard,
  dailyCollection,
  monthlyRevenue,
  outstandingReport,
  expenseReport,
  profitAndLoss,
  exportReport,
  sumIncome,
  sumExpenses,
}
