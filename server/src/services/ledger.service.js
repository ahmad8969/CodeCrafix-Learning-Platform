const crypto = require('crypto')
const {
  StudentFeeAccount,
  Payment,
  Receipt,
  Income,
  FeePlan,
  LateFineRule,
} = require('../models/Finance')
const {
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  RECEIPT_TYPES,
  INCOME_CATEGORIES,
  FINANCE_NOTIFY,
} = require('../constants/finance')
const discountService = require('./discount.service')
const notificationService = require('./notification.service')
const config = require('../config')
const { ApiError } = require('../utils/helpers')

function receiptNumber(prefix = 'RCP') {
  const year = new Date().getFullYear()
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${year}-${rand}`
}

function pushLedger(account, type, amount, note, refType, refId) {
  account.ledger.push({
    at: new Date(),
    type,
    amount,
    balanceAfter: account.remainingAmount,
    note: note || type,
    refType: refType || '',
    refId: refId || null,
  })
  if (account.ledger.length > 200) account.ledger = account.ledger.slice(-200)
}

async function createFeeAccount({
  studentId,
  courseId,
  batchId = null,
  admissionId = null,
  feePlanId,
  instituteId = null,
}) {
  const existing = await StudentFeeAccount.findOne({ student: studentId, course: courseId })
  if (existing) return existing

  const plan = await FeePlan.findById(feePlanId)
  if (!plan) throw new ApiError(400, 'Fee plan required')

  const installments = discountService.buildInstallments(plan)
  const total = plan.totalFee || discountService.computePlanTotal(plan)
  const nextDue = installments.find((i) => i.status !== 'paid')?.dueDate || null

  const account = await StudentFeeAccount.create({
    institute: instituteId,
    student: studentId,
    course: courseId,
    batch: batchId,
    admission: admissionId,
    feePlan: plan._id,
    currency: plan.currency || 'PKR',
    totalFee: total,
    paidAmount: 0,
    remainingAmount: total,
    discountAmount: plan.discount || 0,
    scholarshipAmount: plan.scholarship || 0,
    installments,
    nextDueDate: nextDue,
    status: 'active',
    ledger: [
      {
        at: new Date(),
        type: 'charge',
        amount: total,
        balanceAfter: total,
        note: `Fee plan: ${plan.name}`,
        refType: 'FeePlan',
        refId: plan._id,
      },
    ],
  })
  return account
}

async function refreshOverdue(account) {
  const plan = account.feePlan
    ? await FeePlan.findById(account.feePlan).populate('lateFineRule')
    : null
  const rule =
    plan?.lateFineRule ||
    (plan?.lateFineRule?._id ? await LateFineRule.findById(plan.lateFineRule) : null)

  let overdue = 0
  const now = new Date()
  for (const inst of account.installments || []) {
    const remaining = Math.max(0, (inst.amount || 0) - (inst.paidAmount || 0))
    if (remaining <= 0) {
      inst.status = 'paid'
      continue
    }
    if (inst.dueDate && new Date(inst.dueDate) < now) {
      inst.status = inst.paidAmount > 0 ? 'partial' : 'overdue'
      overdue += remaining
    } else if (inst.paidAmount > 0) {
      inst.status = 'partial'
    } else {
      inst.status = 'pending'
    }
  }

  if (rule && overdue > 0) {
    const due = account.installments.find((i) => i.status === 'overdue')?.dueDate
    const fine = discountService.computeLateFine(rule, due ? new Date(due) : now, now)
    if (fine > (account.fineAmount || 0)) {
      const delta = fine - (account.fineAmount || 0)
      account.fineAmount = fine
      account.totalFee = (account.totalFee || 0) + delta
      account.remainingAmount = (account.remainingAmount || 0) + delta
      pushLedger(account, 'fine', delta, 'Late fine adjustment', 'LateFineRule', rule._id)
    }
  }

  account.overdueAmount = overdue
  account.nextDueDate =
    account.installments.find((i) => i.status !== 'paid')?.dueDate || null
  if (account.remainingAmount <= 0) account.status = 'settled'
  else if (overdue > 0) account.status = 'overdue'
  else account.status = 'active'
  return account
}

async function getLedger(studentId, { courseId } = {}) {
  const q = { student: studentId }
  if (courseId) q.course = courseId
  const accounts = await StudentFeeAccount.find(q)
    .populate('course', 'title slug')
    .populate('batch', 'name batchCode')
    .populate('feePlan', 'name planType currency')
    .lean()
  return accounts
}

async function getAccount(id) {
  const account = await StudentFeeAccount.findById(id)
    .populate('student', 'fullName email phoneNumber')
    .populate('course', 'title slug')
    .populate('batch', 'name batchCode')
    .populate('feePlan')
    .populate('admission', 'admissionNumber status')
  if (!account) throw new ApiError(404, 'Fee account not found')
  await refreshOverdue(account)
  await account.save()
  return account
}

async function allocateToInstallments(account, amount) {
  let left = amount
  for (const inst of account.installments || []) {
    if (left <= 0) break
    const need = Math.max(0, (inst.amount || 0) - (inst.paidAmount || 0))
    if (need <= 0) {
      inst.status = 'paid'
      continue
    }
    const apply = Math.min(need, left)
    inst.paidAmount = (inst.paidAmount || 0) + apply
    left -= apply
    if (inst.paidAmount >= inst.amount) inst.status = 'paid'
    else inst.status = 'partial'
  }
}

async function createReceipt({
  type,
  studentId,
  courseId,
  batchId,
  paymentId,
  admissionId,
  amount,
  currency,
  issuedBy,
  snapshot = {},
}) {
  const token = crypto.randomBytes(16).toString('hex')
  const number = receiptNumber(type === RECEIPT_TYPES.REFUND ? 'REF' : 'RCP')
  const verificationUrl = `${config.clientUrl}/verify/receipt/${token}`
  const receipt = await Receipt.create({
    student: studentId,
    course: courseId,
    batch: batchId,
    payment: paymentId,
    admission: admissionId,
    type,
    amount,
    currency: currency || 'PKR',
    receiptNumber: number,
    verificationToken: token,
    qrPayload: verificationUrl,
    snapshot: { ...snapshot, verificationUrl },
    issuedBy,
  })

  await notificationService.notifyUser({
    userId: studentId,
    templateKey: FINANCE_NOTIFY.RECEIPT_GENERATED,
    title: 'Receipt generated',
    body: `Receipt ${number} for ${amount} ${currency || 'PKR'} is ready.`,
    link: `/student/fees/receipts/${receipt._id}`,
    meta: { receiptId: receipt._id, receiptNumber: number },
  })

  return receipt
}

async function recordPayment(payload, actorId) {
  const account = await StudentFeeAccount.findById(payload.feeAccountId)
  if (!account) throw new ApiError(404, 'Fee account not found')
  if (account.status === 'cancelled') throw new ApiError(400, 'Fee account cancelled')

  const amount = Number(payload.amount)
  if (!(amount > 0)) throw new ApiError(400, 'Invalid payment amount')

  const method = payload.method || PAYMENT_METHODS.CASH
  let status = payload.status || PAYMENT_STATUS.PAID

  // Architecture-ready gateways stay pending until webhook (future)
  if (
    [PAYMENT_METHODS.STRIPE, PAYMENT_METHODS.JAZZCASH, PAYMENT_METHODS.EASYPAISA, PAYMENT_METHODS.CARD].includes(
      method
    ) &&
    !payload.forcePaid
  ) {
    status = PAYMENT_STATUS.PENDING
  }

  const payment = await Payment.create({
    institute: account.institute,
    student: account.student,
    feeAccount: account._id,
    admission: account.admission,
    course: account.course,
    batch: account.batch,
    amount,
    currency: account.currency,
    method,
    status,
    paidAt: status === PAYMENT_STATUS.PAID ? new Date() : null,
    reference: payload.reference || '',
    notes: payload.notes || '',
    installmentIds: payload.installmentIds || [],
    gatewayPlaceholder: payload.gatewayPlaceholder || {
      provider: [PAYMENT_METHODS.STRIPE, PAYMENT_METHODS.JAZZCASH, PAYMENT_METHODS.EASYPAISA].includes(
        method
      )
        ? method
        : null,
    },
    collectedBy: actorId,
  })

  if (status === PAYMENT_STATUS.FAILED) {
    await notificationService.notifyUser({
      userId: account.student,
      templateKey: FINANCE_NOTIFY.PAYMENT_FAILED,
      title: 'Payment failed',
      body: `Payment of ${amount} ${account.currency} could not be processed.`,
      link: '/student/fees',
      meta: { paymentId: payment._id },
    })
    return payment
  }

  if (status === PAYMENT_STATUS.PAID || status === PAYMENT_STATUS.PARTIAL) {
    await applyPaidPayment(payment, account, actorId)
  }

  return Payment.findById(payment._id).populate('receipt').lean()
}

async function applyPaidPayment(payment, accountDoc, actorId) {
  const account = accountDoc || (await StudentFeeAccount.findById(payment.feeAccount))
  const amount = payment.amount

  account.paidAmount = (account.paidAmount || 0) + amount
  account.remainingAmount = Math.max(0, (account.remainingAmount || 0) - amount)
  await allocateToInstallments(account, amount)
  pushLedger(account, 'payment', -amount, `Payment ${payment.method}`, 'Payment', payment._id)
  await refreshOverdue(account)
  await account.save()

  const receipt = await createReceipt({
    type: RECEIPT_TYPES.PAYMENT,
    studentId: account.student,
    courseId: account.course,
    batchId: account.batch,
    paymentId: payment._id,
    admissionId: account.admission,
    amount,
    currency: account.currency,
    issuedBy: actorId,
    snapshot: {
      method: payment.method,
      reference: payment.reference,
      paidAt: payment.paidAt,
    },
  })
  payment.receipt = receipt._id
  payment.status = account.remainingAmount <= 0 ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIAL
  if (!payment.paidAt) payment.paidAt = new Date()
  await payment.save()

  await Income.create({
    institute: account.institute,
    category: INCOME_CATEGORIES.TUITION,
    title: `Fee payment — ${receipt.receiptNumber}`,
    amount,
    currency: account.currency,
    incomeDate: payment.paidAt || new Date(),
    payment: payment._id,
    sourceRef: receipt.receiptNumber,
    createdBy: actorId,
  })

  await notificationService.notifyUser({
    userId: account.student,
    templateKey: FINANCE_NOTIFY.PAYMENT_RECEIVED,
    title: 'Payment received',
    body: `We received ${amount} ${account.currency}. Remaining: ${account.remainingAmount}.`,
    link: `/student/fees/receipts/${receipt._id}`,
    meta: { paymentId: payment._id, receiptId: receipt._id },
  })

  return payment
}

async function confirmGatewayPayment(paymentId, actorId) {
  const payment = await Payment.findById(paymentId)
  if (!payment) throw new ApiError(404, 'Payment not found')
  if (payment.status === PAYMENT_STATUS.PAID) return payment
  if (payment.status === PAYMENT_STATUS.REFUNDED) throw new ApiError(400, 'Already refunded')
  payment.status = PAYMENT_STATUS.PAID
  payment.paidAt = new Date()
  await payment.save()
  await applyPaidPayment(payment, null, actorId)
  return Payment.findById(paymentId).populate('receipt')
}

async function refundPayment(paymentId, { amount, reason }, actorId) {
  const original = await Payment.findById(paymentId)
  if (!original) throw new ApiError(404, 'Payment not found')
  if (original.status === PAYMENT_STATUS.REFUNDED) throw new ApiError(409, 'Already refunded')
  if (original.status !== PAYMENT_STATUS.PAID && original.status !== PAYMENT_STATUS.PARTIAL) {
    throw new ApiError(400, 'Only paid payments can be refunded')
  }

  const refundAmount = amount != null ? Number(amount) : original.amount
  if (!(refundAmount > 0) || refundAmount > original.amount) {
    throw new ApiError(400, 'Invalid refund amount')
  }

  const account = await StudentFeeAccount.findById(original.feeAccount)
  account.paidAmount = Math.max(0, (account.paidAmount || 0) - refundAmount)
  account.remainingAmount = (account.remainingAmount || 0) + refundAmount
  account.refundAmount = (account.refundAmount || 0) + refundAmount
  pushLedger(account, 'refund', refundAmount, reason || 'Refund', 'Payment', original._id)
  await refreshOverdue(account)
  await account.save()

  original.status = PAYMENT_STATUS.REFUNDED
  await original.save()

  const refundPaymentDoc = await Payment.create({
    institute: original.institute,
    student: original.student,
    feeAccount: original.feeAccount,
    admission: original.admission,
    course: original.course,
    batch: original.batch,
    amount: refundAmount,
    currency: original.currency,
    method: original.method,
    status: PAYMENT_STATUS.REFUNDED,
    paidAt: new Date(),
    reference: reason || '',
    notes: `Refund of ${original._id}`,
    refundOf: original._id,
    collectedBy: actorId,
  })

  const receipt = await createReceipt({
    type: RECEIPT_TYPES.REFUND,
    studentId: account.student,
    courseId: account.course,
    batchId: account.batch,
    paymentId: refundPaymentDoc._id,
    admissionId: account.admission,
    amount: refundAmount,
    currency: account.currency,
    issuedBy: actorId,
    snapshot: { reason, originalPaymentId: original._id },
  })
  refundPaymentDoc.receipt = receipt._id
  await refundPaymentDoc.save()

  return refundPaymentDoc
}

async function listPayments(filters = {}) {
  const q = {}
  if (filters.studentId) q.student = filters.studentId
  if (filters.feeAccountId) q.feeAccount = filters.feeAccountId
  if (filters.status) q.status = filters.status
  if (filters.method) q.method = filters.method
  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Number(filters.limit) || 20)
  const [items, total] = await Promise.all([
    Payment.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'fullName email')
      .populate('course', 'title')
      .populate('receipt', 'receiptNumber')
      .lean(),
    Payment.countDocuments(q),
  ])
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
}

async function getReceipt(id) {
  const receipt = await Receipt.findById(id)
    .populate('student', 'fullName email phoneNumber')
    .populate('course', 'title')
    .populate('batch', 'name batchCode')
    .populate('payment')
    .populate('issuedBy', 'fullName')
    .lean()
  if (!receipt) throw new ApiError(404, 'Receipt not found')
  return receipt
}

async function listReceipts(filters = {}) {
  const q = {}
  if (filters.studentId) q.student = filters.studentId
  if (filters.type) q.type = filters.type
  return Receipt.find(q)
    .sort({ issuedAt: -1 })
    .limit(Math.min(100, Number(filters.limit) || 50))
    .populate('student', 'fullName')
    .populate('course', 'title')
    .lean()
}

async function verifyReceipt(token) {
  const receipt = await Receipt.findOne({ verificationToken: token })
    .populate('student', 'fullName')
    .populate('course', 'title')
    .lean()
  if (!receipt) return { valid: false, message: 'Receipt not found' }
  return {
    valid: true,
    receiptNumber: receipt.receiptNumber,
    type: receipt.type,
    amount: receipt.amount,
    currency: receipt.currency,
    issuedAt: receipt.issuedAt,
    studentName: receipt.student?.fullName,
    courseName: receipt.course?.title,
    snapshot: receipt.snapshot,
  }
}

module.exports = {
  createFeeAccount,
  getLedger,
  getAccount,
  refreshOverdue,
  recordPayment,
  confirmGatewayPayment,
  refundPayment,
  listPayments,
  createReceipt,
  getReceipt,
  listReceipts,
  verifyReceipt,
}
