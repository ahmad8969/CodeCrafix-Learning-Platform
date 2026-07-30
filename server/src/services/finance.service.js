const { Expense, Income, StudentFeeAccount, Payment } = require('../models/Finance')
const { PAYMENT_STATUS } = require('../constants/finance')
const { ApiError } = require('../utils/helpers')

async function listExpenses(filters = {}) {
  const q = {}
  if (filters.category) q.category = filters.category
  if (filters.from || filters.to) {
    q.expenseDate = {}
    if (filters.from) q.expenseDate.$gte = new Date(filters.from)
    if (filters.to) q.expenseDate.$lte = new Date(filters.to)
  }
  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Number(filters.limit) || 30)
  const [items, total] = await Promise.all([
    Expense.find(q)
      .sort({ expenseDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'fullName')
      .lean(),
    Expense.countDocuments(q),
  ])
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
}

async function createExpense(payload, userId) {
  return Expense.create({ ...payload, createdBy: userId })
}

async function updateExpense(id, payload) {
  const doc = await Expense.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
  if (!doc) throw new ApiError(404, 'Expense not found')
  return doc
}

async function deleteExpense(id) {
  const doc = await Expense.findByIdAndDelete(id)
  if (!doc) throw new ApiError(404, 'Expense not found')
  return { deleted: true }
}

async function listIncome(filters = {}) {
  const q = {}
  if (filters.category) q.category = filters.category
  if (filters.from || filters.to) {
    q.incomeDate = {}
    if (filters.from) q.incomeDate.$gte = new Date(filters.from)
    if (filters.to) q.incomeDate.$lte = new Date(filters.to)
  }
  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Number(filters.limit) || 30)
  const [items, total] = await Promise.all([
    Income.find(q)
      .sort({ incomeDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'fullName')
      .lean(),
    Income.countDocuments(q),
  ])
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
}

async function createIncome(payload, userId) {
  return Income.create({ ...payload, createdBy: userId })
}

async function updateIncome(id, payload) {
  const doc = await Income.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
  if (!doc) throw new ApiError(404, 'Income not found')
  return doc
}

async function deleteIncome(id) {
  const doc = await Income.findByIdAndDelete(id)
  if (!doc) throw new ApiError(404, 'Income not found')
  return { deleted: true }
}

async function teacherFeeVisibility({ courseId, batchId } = {}) {
  const q = { status: { $in: ['active', 'overdue'] } }
  if (courseId) q.course = courseId
  if (batchId) q.batch = batchId
  const accounts = await StudentFeeAccount.find(q)
    .select('student course batch remainingAmount overdueAmount status nextDueDate paidAmount totalFee')
    .populate('student', 'fullName email')
    .populate('course', 'title')
    .populate('batch', 'name batchCode')
    .sort({ overdueAmount: -1 })
    .limit(100)
    .lean()
  return {
    defaulters: accounts.filter((a) => (a.overdueAmount || 0) > 0 || a.status === 'overdue'),
    accounts,
  }
}

async function sendDueReminders() {
  const soon = new Date()
  soon.setDate(soon.getDate() + 3)
  const accounts = await StudentFeeAccount.find({
    status: { $in: ['active', 'overdue'] },
    remainingAmount: { $gt: 0 },
    nextDueDate: { $lte: soon },
  }).limit(100)
  const notificationService = require('./notification.service')
  const { FINANCE_NOTIFY } = require('../constants/finance')
  let count = 0
  for (const a of accounts) {
    const overdue = a.status === 'overdue' || (a.overdueAmount || 0) > 0
    await notificationService.notifyUser({
      userId: a.student,
      templateKey: overdue ? FINANCE_NOTIFY.OVERDUE : FINANCE_NOTIFY.FEE_DUE,
      title: overdue ? 'Fee overdue' : 'Fee due reminder',
      body: `Outstanding balance: ${a.remainingAmount}. Next due: ${
        a.nextDueDate ? new Date(a.nextDueDate).toLocaleDateString() : '—'
      }`,
      link: '/student/fees',
      meta: { feeAccountId: a._id },
    })
    count += 1
  }
  return { notified: count }
}

module.exports = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  teacherFeeVisibility,
  sendDueReminders,
  Payment,
  PAYMENT_STATUS,
}
