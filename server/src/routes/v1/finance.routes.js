const express = require('express')
const controller = require('../../controllers/finance.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const {
  mongoId,
  admissionCreateRules,
  feePlanRules,
  paymentRules,
  discountRules,
  expenseRules,
  incomeRules,
  listRules,
} = require('../../validators/finance.validator')

const router = express.Router()

// Public receipt verification
router.get('/receipts/verify/:token', controller.verifyReceipt)

router.use(protect)

// Dashboard & reports
router.get('/dashboard', requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE), controller.dashboard)
router.get('/reports/daily', requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE), controller.reportDaily)
router.get('/reports/monthly', requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE), controller.reportMonthly)
router.get(
  '/reports/outstanding',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  controller.reportOutstanding
)
router.get('/reports/expenses', requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE), controller.reportExpenses)
router.get('/reports/pnl', requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE), controller.reportPnL)
router.get(
  '/reports/export/:type',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  controller.exportReport
)
router.post(
  '/reminders/due',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  controller.sendReminders
)

// Teacher view (read-only)
router.get('/teacher/status', requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW), controller.teacherView)

// Admissions
router.get(
  '/admissions',
  requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW),
  listRules,
  validate,
  controller.listAdmissions
)
router.post(
  '/admissions',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  admissionCreateRules,
  validate,
  controller.createAdmission
)
router.get(
  '/admissions/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW),
  mongoId('id'),
  validate,
  controller.getAdmission
)
router.patch(
  '/admissions/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.updateAdmission
)
router.post(
  '/admissions/:id/approve',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.approveAdmission
)
router.post(
  '/admissions/:id/reject',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.rejectAdmission
)
router.post(
  '/admissions/:id/cancel',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.cancelAdmission
)

// Fee plans
router.get('/fee-plans', requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW), controller.listFeePlans)
router.post(
  '/fee-plans',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  feePlanRules,
  validate,
  controller.createFeePlan
)
router.get(
  '/fee-plans/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW),
  mongoId('id'),
  validate,
  controller.getFeePlan
)
router.patch(
  '/fee-plans/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.updateFeePlan
)
router.delete(
  '/fee-plans/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.deleteFeePlan
)

// Discounts & late fines
router.get('/discounts', requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW), controller.listDiscounts)
router.post(
  '/discounts',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  discountRules,
  validate,
  controller.upsertDiscount
)
router.post(
  '/discounts/apply',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  controller.applyDiscount
)
router.get('/late-fines', requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW), controller.listLateFines)
router.post(
  '/late-fines',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  controller.upsertLateFine
)

// Ledger
router.get('/ledger/me', requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW), controller.myLedger)
router.get(
  '/ledger/students/:studentId',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('studentId'),
  validate,
  controller.studentLedger
)
router.get(
  '/accounts/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW),
  mongoId('id'),
  validate,
  controller.getFeeAccount
)

// Payments
router.get('/payments', requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW), controller.listPayments)
router.post(
  '/payments',
  requirePermission(COURSE_PERMISSIONS.FINANCE_COLLECT),
  paymentRules,
  validate,
  controller.recordPayment
)
router.post(
  '/payments/:id/confirm',
  requirePermission(COURSE_PERMISSIONS.FINANCE_COLLECT),
  mongoId('id'),
  validate,
  controller.confirmPayment
)
router.post(
  '/payments/:id/refund',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.refundPayment
)

// Receipts
router.get('/receipts', requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW), controller.listReceipts)
router.get(
  '/receipts/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_VIEW),
  mongoId('id'),
  validate,
  controller.getReceipt
)

// Expenses
router.get('/expenses', requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE), controller.listExpenses)
router.post(
  '/expenses',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  expenseRules,
  validate,
  controller.createExpense
)
router.patch(
  '/expenses/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.updateExpense
)
router.delete(
  '/expenses/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.deleteExpense
)

// Income
router.get('/income', requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE), controller.listIncome)
router.post(
  '/income',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  incomeRules,
  validate,
  controller.createIncome
)
router.patch(
  '/income/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.updateIncome
)
router.delete(
  '/income/:id',
  requirePermission(COURSE_PERMISSIONS.FINANCE_MANAGE),
  mongoId('id'),
  validate,
  controller.deleteIncome
)

module.exports = router
