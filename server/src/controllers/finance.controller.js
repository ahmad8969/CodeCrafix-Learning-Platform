const admissionService = require('../services/admission.service')
const discountService = require('../services/discount.service')
const ledgerService = require('../services/ledger.service')
const financeService = require('../services/finance.service')
const reportingService = require('../services/reporting.service')
const auditService = require('../services/audit.service')
const notificationService = require('../services/notification.service')
const { FINANCE_NOTIFY } = require('../constants/finance')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ROLES } = require('../constants')

// —— Admissions ——
const listAdmissions = asyncHandler(async (req, res) => {
  const filters = { ...req.query }
  if (req.user.role === ROLES.STUDENT) filters.studentId = req.user._id
  sendSuccess(res, await admissionService.listAdmissions(filters))
})

const getAdmission = asyncHandler(async (req, res) => {
  const data = await admissionService.getAdmission(req.params.id)
  if (
    req.user.role === ROLES.STUDENT &&
    String(data.student?._id || data.student) !== String(req.user._id)
  ) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  sendSuccess(res, data)
})

const createAdmission = asyncHandler(async (req, res) => {
  const data = await admissionService.createAdmission(req.body, req.user._id)
  await auditService.record(req, {
    action: 'admission_created',
    resourceType: 'Admission',
    resourceId: data._id,
    newValue: { student: data.student, course: data.course },
  })
  sendSuccess(res, data, 'Admission created', 201)
})

const updateAdmission = asyncHandler(async (req, res) => {
  const data = await admissionService.updateAdmission(req.params.id, req.body)
  await auditService.record(req, {
    action: 'admission_updated',
    resourceType: 'Admission',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Admission updated')
})

const approveAdmission = asyncHandler(async (req, res) => {
  const data = await admissionService.approveAdmission(req.params.id, req.user._id)
  await auditService.record(req, {
    action: 'admission_approved',
    resourceType: 'Admission',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Admission approved')
})

const rejectAdmission = asyncHandler(async (req, res) => {
  const data = await admissionService.rejectAdmission(
    req.params.id,
    req.body.reason,
    req.user._id
  )
  await auditService.record(req, {
    action: 'admission_rejected',
    resourceType: 'Admission',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Admission rejected')
})

const cancelAdmission = asyncHandler(async (req, res) => {
  const data = await admissionService.cancelAdmission(req.params.id, req.user._id)
  await auditService.record(req, {
    action: 'admission_cancelled',
    resourceType: 'Admission',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Admission cancelled')
})

// —— Fee plans / discounts ——
const listFeePlans = asyncHandler(async (req, res) => {
  sendSuccess(res, await discountService.listFeePlans(req.query))
})

const getFeePlan = asyncHandler(async (req, res) => {
  sendSuccess(res, await discountService.getFeePlan(req.params.id))
})

const createFeePlan = asyncHandler(async (req, res) => {
  const data = await discountService.createFeePlan(req.body, req.user._id)
  await auditService.record(req, {
    action: 'fee_plan_created',
    resourceType: 'FeePlan',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Fee plan created', 201)
})

const updateFeePlan = asyncHandler(async (req, res) => {
  const data = await discountService.updateFeePlan(req.params.id, req.body)
  await auditService.record(req, {
    action: 'fee_plan_updated',
    resourceType: 'FeePlan',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Fee plan updated')
})

const deleteFeePlan = asyncHandler(async (req, res) => {
  const data = await discountService.deleteFeePlan(req.params.id)
  sendSuccess(res, data, 'Fee plan deactivated')
})

const listDiscounts = asyncHandler(async (req, res) => {
  sendSuccess(res, await discountService.listDiscountRules(req.query))
})

const upsertDiscount = asyncHandler(async (req, res) => {
  const data = await discountService.upsertDiscountRule(req.body, req.user._id)
  await auditService.record(req, {
    action: 'discount_upserted',
    resourceType: 'DiscountRule',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Discount saved')
})

const applyDiscount = asyncHandler(async (req, res) => {
  const data = await discountService.applyDiscountToAccount(
    req.body.feeAccountId,
    req.body.discountRuleId,
    { actorId: req.user._id }
  )
  if (data.rule?.type === 'scholarship') {
    await notificationService.notifyUser({
      userId: data.account.student,
      templateKey: FINANCE_NOTIFY.SCHOLARSHIP_APPROVED,
      title: 'Scholarship applied',
      body: `${data.rule.name}: ${data.amount} discount applied to your fee account.`,
      link: '/student/fees',
    })
  }
  await auditService.record(req, {
    action: 'discount_applied',
    resourceType: 'StudentFeeAccount',
    resourceId: data.account._id,
    newValue: { amount: data.amount, rule: data.rule?.name },
  })
  sendSuccess(res, data, 'Discount applied')
})

const listLateFines = asyncHandler(async (req, res) => {
  sendSuccess(res, await discountService.listLateFineRules(req.query))
})

const upsertLateFine = asyncHandler(async (req, res) => {
  const data = await discountService.upsertLateFineRule(req.body)
  sendSuccess(res, data, 'Late fine rule saved')
})

// —— Ledger / payments / receipts ——
const myLedger = asyncHandler(async (req, res) => {
  sendSuccess(res, await ledgerService.getLedger(req.user._id, req.query))
})

const studentLedger = asyncHandler(async (req, res) => {
  const isSelf = String(req.params.studentId) === String(req.user._id)
  const isStaff = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(req.user.role)
  if (!isSelf && !isStaff) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  sendSuccess(res, await ledgerService.getLedger(req.params.studentId, req.query))
})

const getFeeAccount = asyncHandler(async (req, res) => {
  const data = await ledgerService.getAccount(req.params.id)
  if (
    req.user.role === ROLES.STUDENT &&
    String(data.student?._id || data.student) !== String(req.user._id)
  ) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  sendSuccess(res, data)
})

const listPayments = asyncHandler(async (req, res) => {
  const filters = { ...req.query }
  if (req.user.role === ROLES.STUDENT) filters.studentId = req.user._id
  sendSuccess(res, await ledgerService.listPayments(filters))
})

const recordPayment = asyncHandler(async (req, res) => {
  const data = await ledgerService.recordPayment(req.body, req.user._id)
  await auditService.record(req, {
    action: 'payment_recorded',
    resourceType: 'Payment',
    resourceId: data._id,
    newValue: { amount: data.amount, method: data.method, status: data.status },
  })
  sendSuccess(res, data, 'Payment recorded', 201)
})

const confirmPayment = asyncHandler(async (req, res) => {
  const data = await ledgerService.confirmGatewayPayment(req.params.id, req.user._id)
  await auditService.record(req, {
    action: 'payment_confirmed',
    resourceType: 'Payment',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Payment confirmed')
})

const refundPayment = asyncHandler(async (req, res) => {
  const data = await ledgerService.refundPayment(
    req.params.id,
    { amount: req.body.amount, reason: req.body.reason },
    req.user._id
  )
  await auditService.record(req, {
    action: 'payment_refunded',
    resourceType: 'Payment',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Refund processed')
})

const listReceipts = asyncHandler(async (req, res) => {
  const filters = { ...req.query }
  if (req.user.role === ROLES.STUDENT) filters.studentId = req.user._id
  sendSuccess(res, await ledgerService.listReceipts(filters))
})

const getReceipt = asyncHandler(async (req, res) => {
  const data = await ledgerService.getReceipt(req.params.id)
  if (
    req.user.role === ROLES.STUDENT &&
    String(data.student?._id || data.student) !== String(req.user._id)
  ) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  sendSuccess(res, data)
})

const verifyReceipt = asyncHandler(async (req, res) => {
  sendSuccess(res, await ledgerService.verifyReceipt(req.params.token))
})

// —— Expenses / income ——
const listExpenses = asyncHandler(async (req, res) => {
  sendSuccess(res, await financeService.listExpenses(req.query))
})

const createExpense = asyncHandler(async (req, res) => {
  const data = await financeService.createExpense(req.body, req.user._id)
  await auditService.record(req, {
    action: 'expense_created',
    resourceType: 'Expense',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Expense recorded', 201)
})

const updateExpense = asyncHandler(async (req, res) => {
  const data = await financeService.updateExpense(req.params.id, req.body)
  sendSuccess(res, data, 'Expense updated')
})

const deleteExpense = asyncHandler(async (req, res) => {
  sendSuccess(res, await financeService.deleteExpense(req.params.id), 'Expense deleted')
})

const listIncome = asyncHandler(async (req, res) => {
  sendSuccess(res, await financeService.listIncome(req.query))
})

const createIncome = asyncHandler(async (req, res) => {
  const data = await financeService.createIncome(req.body, req.user._id)
  await auditService.record(req, {
    action: 'income_created',
    resourceType: 'Income',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Income recorded', 201)
})

const updateIncome = asyncHandler(async (req, res) => {
  sendSuccess(res, await financeService.updateIncome(req.params.id, req.body), 'Income updated')
})

const deleteIncome = asyncHandler(async (req, res) => {
  sendSuccess(res, await financeService.deleteIncome(req.params.id), 'Income deleted')
})

// —— Reports / dashboard ——
const dashboard = asyncHandler(async (req, res) => {
  sendSuccess(res, await reportingService.dashboard())
})

const reportDaily = asyncHandler(async (req, res) => {
  sendSuccess(res, await reportingService.dailyCollection(req.query.date ? new Date(req.query.date) : new Date()))
})

const reportMonthly = asyncHandler(async (req, res) => {
  const now = new Date()
  sendSuccess(
    res,
    await reportingService.monthlyRevenue(
      Number(req.query.year) || now.getFullYear(),
      Number(req.query.month) || now.getMonth() + 1
    )
  )
})

const reportOutstanding = asyncHandler(async (req, res) => {
  sendSuccess(res, await reportingService.outstandingReport())
})

const reportExpenses = asyncHandler(async (req, res) => {
  sendSuccess(res, await reportingService.expenseReport(req.query))
})

const reportPnL = asyncHandler(async (req, res) => {
  sendSuccess(res, await reportingService.profitAndLoss(req.query))
})

const exportReport = asyncHandler(async (req, res) => {
  const data = await reportingService.exportReport(
    req.params.type,
    req.query.format || 'csv',
    req.query
  )
  res.setHeader('Content-Type', data.contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`)
  res.send(data.body)
})

const teacherView = asyncHandler(async (req, res) => {
  sendSuccess(res, await financeService.teacherFeeVisibility(req.query))
})

const sendReminders = asyncHandler(async (req, res) => {
  sendSuccess(res, await financeService.sendDueReminders(), 'Reminders sent')
})

module.exports = {
  listAdmissions,
  getAdmission,
  createAdmission,
  updateAdmission,
  approveAdmission,
  rejectAdmission,
  cancelAdmission,
  listFeePlans,
  getFeePlan,
  createFeePlan,
  updateFeePlan,
  deleteFeePlan,
  listDiscounts,
  upsertDiscount,
  applyDiscount,
  listLateFines,
  upsertLateFine,
  myLedger,
  studentLedger,
  getFeeAccount,
  listPayments,
  recordPayment,
  confirmPayment,
  refundPayment,
  listReceipts,
  getReceipt,
  verifyReceipt,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  dashboard,
  reportDaily,
  reportMonthly,
  reportOutstanding,
  reportExpenses,
  reportPnL,
  exportReport,
  teacherView,
  sendReminders,
}
