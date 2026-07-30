const crypto = require('crypto')
const {
  FeePlan,
  DiscountRule,
  LateFineRule,
  StudentFeeAccount,
} = require('../models/Finance')
const { DISCOUNT_TYPES } = require('../constants/finance')
const { ApiError } = require('../utils/helpers')

function computePlanTotal(plan) {
  const gross =
    (plan.admissionFee || 0) +
    (plan.securityFee || 0) +
    (plan.registrationFee || 0) +
    (plan.tuitionFee || 0) +
    (plan.labFee || 0) +
    (plan.otherCharges || 0)
  const discount = plan.discount || 0
  const scholarship = plan.scholarship || 0
  const subtotal = Math.max(0, gross - discount - scholarship)
  const taxAmount =
    plan.taxAmount != null && plan.taxAmount > 0
      ? plan.taxAmount
      : Math.round(((subtotal * (plan.taxPercent || 0)) / 100) * 100) / 100
  return Math.max(0, subtotal + taxAmount)
}

function buildInstallments(plan, startDate = new Date()) {
  if (Array.isArray(plan.installments) && plan.installments.length) {
    return plan.installments.map((i, idx) => ({
      label: i.label || `Installment ${idx + 1}`,
      amount: i.amount,
      dueDate: i.dueDate || null,
      sequence: i.sequence || idx + 1,
      paidAmount: 0,
      status: 'pending',
    }))
  }

  const total = plan.totalFee || computePlanTotal(plan)
  const count = Math.max(1, plan.installmentCount || 1)
  const base = Math.floor((total / count) * 100) / 100
  const items = []
  let allocated = 0
  for (let i = 0; i < count; i += 1) {
    const amount = i === count - 1 ? Math.round((total - allocated) * 100) / 100 : base
    allocated += amount
    const due = new Date(startDate)
    if (plan.planType === 'weekly') due.setDate(due.getDate() + 7 * i)
    else if (plan.planType === 'monthly') due.setMonth(due.getMonth() + i)
    else if (i > 0) due.setMonth(due.getMonth() + i)
    items.push({
      label: count === 1 ? 'Full payment' : `Installment ${i + 1}`,
      amount,
      dueDate: due,
      sequence: i + 1,
      paidAmount: 0,
      status: 'pending',
    })
  }
  return items
}

function calculateDiscountAmount(rule, baseAmount) {
  let amount = 0
  if (
    rule.type === DISCOUNT_TYPES.PERCENTAGE ||
    rule.type === DISCOUNT_TYPES.EARLY_BIRD ||
    rule.type === DISCOUNT_TYPES.STAFF ||
    rule.type === DISCOUNT_TYPES.SIBLING
  ) {
    amount = Math.round(((baseAmount * rule.value) / 100) * 100) / 100
  } else {
    amount = rule.value
  }
  if (rule.maxAmount != null) amount = Math.min(amount, rule.maxAmount)
  return Math.min(baseAmount, Math.max(0, amount))
}

async function applyDiscountToAccount(accountId, ruleId, { actorId } = {}) {
  const account = await StudentFeeAccount.findById(accountId)
  if (!account) throw new ApiError(404, 'Fee account not found')
  const rule = await DiscountRule.findById(ruleId)
  if (!rule || !rule.active) throw new ApiError(404, 'Discount rule not found')

  const now = new Date()
  if (rule.validFrom && now < rule.validFrom) throw new ApiError(400, 'Discount not yet valid')
  if (rule.validUntil && now > rule.validUntil) throw new ApiError(400, 'Discount expired')

  if ((account.appliedDiscounts || []).some((d) => String(d.rule) === String(ruleId))) {
    throw new ApiError(409, 'Discount already applied')
  }

  const base = account.remainingAmount || account.totalFee
  const amount = calculateDiscountAmount(rule, base)
  account.discountAmount = (account.discountAmount || 0) + amount
  if (rule.type === DISCOUNT_TYPES.SCHOLARSHIP) {
    account.scholarshipAmount = (account.scholarshipAmount || 0) + amount
  }
  account.totalFee = Math.max(0, (account.totalFee || 0) - amount)
  account.remainingAmount = Math.max(0, (account.remainingAmount || 0) - amount)
  account.appliedDiscounts.push({
    rule: rule._id,
    name: rule.name,
    type: rule.type,
    amount,
    appliedAt: now,
  })
  account.ledger.push({
    at: now,
    type: rule.type === DISCOUNT_TYPES.SCHOLARSHIP ? 'scholarship' : 'discount',
    amount: -amount,
    balanceAfter: account.remainingAmount,
    note: `${rule.name} applied`,
    refType: 'DiscountRule',
    refId: rule._id,
  })
  await account.save()
  return { account, amount, rule, actorId }
}

function computeLateFine(rule, dueDate, asOf = new Date()) {
  if (!rule || !dueDate) return 0
  const graceMs = (rule.gracePeriodDays || 0) * 86400000
  const overdueStart = new Date(dueDate.getTime() + graceMs)
  if (asOf <= overdueStart) return 0
  const diffDays = Math.ceil((asOf - overdueStart) / 86400000)
  let periods = diffDays
  if (rule.period === 'weekly') periods = Math.ceil(diffDays / 7)
  if (rule.period === 'monthly') periods = Math.ceil(diffDays / 30)
  let fine = periods * (rule.amount || 0)
  if (rule.maxFineCap > 0) fine = Math.min(fine, rule.maxFineCap)
  return Math.max(0, fine)
}

async function listDiscountRules(filters = {}) {
  const q = {}
  if (filters.active != null) q.active = filters.active === true || filters.active === 'true'
  if (filters.type) q.type = filters.type
  return DiscountRule.find(q).sort({ name: 1 }).lean()
}

async function upsertDiscountRule(payload, userId) {
  if (payload._id) {
    return DiscountRule.findByIdAndUpdate(
      payload._id,
      { ...payload, createdBy: userId },
      { new: true, runValidators: true }
    )
  }
  return DiscountRule.create({ ...payload, createdBy: userId })
}

async function listLateFineRules(filters = {}) {
  const q = {}
  if (filters.active != null) q.active = filters.active === true || filters.active === 'true'
  return LateFineRule.find(q).sort({ name: 1 }).lean()
}

async function upsertLateFineRule(payload) {
  if (payload._id) {
    return LateFineRule.findByIdAndUpdate(payload._id, payload, { new: true, runValidators: true })
  }
  return LateFineRule.create(payload)
}

async function listFeePlans(filters = {}) {
  const q = {}
  if (filters.courseId) q.course = filters.courseId
  if (filters.active != null) q.active = filters.active === true || filters.active === 'true'
  return FeePlan.find(q)
    .populate('course', 'title slug')
    .populate('batch', 'name batchCode')
    .populate('lateFineRule')
    .sort({ name: 1 })
    .lean()
}

async function getFeePlan(id) {
  const plan = await FeePlan.findById(id)
    .populate('course', 'title')
    .populate('lateFineRule')
    .lean()
  if (!plan) throw new ApiError(404, 'Fee plan not found')
  return plan
}

async function createFeePlan(payload, userId) {
  const data = { ...payload, createdBy: userId }
  data.totalFee = computePlanTotal(data)
  if (!data.installments?.length) {
    data.installments = buildInstallments(data).map(({ paidAmount, status, ...rest }) => rest)
  }
  return FeePlan.create(data)
}

async function updateFeePlan(id, payload) {
  const data = { ...payload }
  if (
    data.admissionFee != null ||
    data.tuitionFee != null ||
    data.discount != null ||
    data.scholarship != null ||
    data.taxPercent != null
  ) {
    const existing = await FeePlan.findById(id).lean()
    data.totalFee = computePlanTotal({ ...existing, ...data })
  }
  const plan = await FeePlan.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  if (!plan) throw new ApiError(404, 'Fee plan not found')
  return plan
}

async function deleteFeePlan(id) {
  const plan = await FeePlan.findByIdAndUpdate(id, { active: false }, { new: true })
  if (!plan) throw new ApiError(404, 'Fee plan not found')
  return plan
}

module.exports = {
  computePlanTotal,
  buildInstallments,
  calculateDiscountAmount,
  applyDiscountToAccount,
  computeLateFine,
  listDiscountRules,
  upsertDiscountRule,
  listLateFineRules,
  upsertLateFineRule,
  listFeePlans,
  getFeePlan,
  createFeePlan,
  updateFeePlan,
  deleteFeePlan,
}
