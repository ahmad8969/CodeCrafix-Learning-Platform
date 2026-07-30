const { body, param, query } = require('express-validator')
const {
  ADMISSION_TYPES,
  ADMISSION_STATUS,
  FEE_PLAN_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  DISCOUNT_TYPES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} = require('../constants/finance')

const mongoId = (field = 'id') => param(field).isMongoId()

const admissionCreateRules = [
  body('student').isMongoId(),
  body('course').isMongoId(),
  body('batch').optional().isMongoId(),
  body('feePlan').optional().isMongoId(),
  body('type').optional().isIn(Object.values(ADMISSION_TYPES)),
  body('session').optional().isString().trim(),
  body('referralSource').optional().isString().trim(),
  body('remarks').optional().isString(),
]

const feePlanRules = [
  body('name').isString().trim().isLength({ min: 2, max: 160 }),
  body('planType').optional().isIn(Object.values(FEE_PLAN_TYPES)),
  body('course').optional().isMongoId(),
  body('tuitionFee').optional().isFloat({ min: 0 }),
  body('admissionFee').optional().isFloat({ min: 0 }),
  body('installmentCount').optional().isInt({ min: 1 }),
]

const paymentRules = [
  body('feeAccountId').isMongoId(),
  body('amount').isFloat({ min: 0.01 }),
  body('method').optional().isIn(Object.values(PAYMENT_METHODS)),
  body('status').optional().isIn(Object.values(PAYMENT_STATUS)),
  body('reference').optional().isString().trim(),
  body('forcePaid').optional().isBoolean(),
]

const discountRules = [
  body('name').isString().trim().isLength({ min: 2 }),
  body('type').optional().isIn(Object.values(DISCOUNT_TYPES)),
  body('value').isFloat({ min: 0 }),
]

const expenseRules = [
  body('title').isString().trim().isLength({ min: 2 }),
  body('amount').isFloat({ min: 0 }),
  body('category').optional().isIn(Object.values(EXPENSE_CATEGORIES)),
]

const incomeRules = [
  body('title').isString().trim().isLength({ min: 2 }),
  body('amount').isFloat({ min: 0 }),
  body('category').optional().isIn(Object.values(INCOME_CATEGORIES)),
]

const listRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(ADMISSION_STATUS)),
]

module.exports = {
  mongoId,
  admissionCreateRules,
  feePlanRules,
  paymentRules,
  discountRules,
  expenseRules,
  incomeRules,
  listRules,
}
