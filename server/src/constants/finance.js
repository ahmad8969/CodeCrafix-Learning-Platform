const ADMISSION_TYPES = Object.freeze({
  NEW: 'new',
  RE_ADMISSION: 're_admission',
  TRANSFER: 'transfer',
  ONLINE: 'online',
})

const ADMISSION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
})

const FEE_PLAN_TYPES = Object.freeze({
  ONE_TIME: 'one_time',
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
  CUSTOM: 'custom',
})

const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  JAZZCASH: 'jazzcash',
  EASYPAISA: 'easypaisa',
  CARD: 'card',
  STRIPE: 'stripe',
})

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  REFUNDED: 'refunded',
  FAILED: 'failed',
})

const RECEIPT_TYPES = Object.freeze({
  ADMISSION: 'admission',
  FEE: 'fee',
  PAYMENT: 'payment',
  REFUND: 'refund',
})

const DISCOUNT_TYPES = Object.freeze({
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  EARLY_BIRD: 'early_bird',
  SCHOLARSHIP: 'scholarship',
  COUPON: 'coupon',
  STAFF: 'staff',
  SIBLING: 'sibling',
})

const LATE_FINE_PERIODS = Object.freeze({
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
})

const EXPENSE_CATEGORIES = Object.freeze({
  RENT: 'rent',
  ELECTRICITY: 'electricity',
  INTERNET: 'internet',
  SALARIES: 'salaries',
  MARKETING: 'marketing',
  STATIONERY: 'stationery',
  EQUIPMENT: 'equipment',
  MISCELLANEOUS: 'miscellaneous',
})

const INCOME_CATEGORIES = Object.freeze({
  ADMISSIONS: 'admissions',
  TUITION: 'tuition_fees',
  WORKSHOPS: 'workshops',
  CERTIFICATIONS: 'certifications',
  OTHER: 'other_income',
})

const FINANCE_NOTIFY = Object.freeze({
  FEE_DUE: 'fee_due_reminder',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  OVERDUE: 'overdue_fee',
  RECEIPT_GENERATED: 'receipt_generated',
  SCHOLARSHIP_APPROVED: 'scholarship_approved',
  ADMISSION_APPROVED: 'admission_approved',
  ADMISSION_REJECTED: 'admission_rejected',
})

module.exports = {
  ADMISSION_TYPES,
  ADMISSION_STATUS,
  FEE_PLAN_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  RECEIPT_TYPES,
  DISCOUNT_TYPES,
  LATE_FINE_PERIODS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  FINANCE_NOTIFY,
}
