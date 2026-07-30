const mongoose = require('mongoose')
const {
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
} = require('../constants/finance')

const installmentSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, default: null },
    sequence: { type: Number, default: 1 },
  },
  { _id: true }
)

const lateFineRuleSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    name: { type: String, required: true },
    gracePeriodDays: { type: Number, default: 3, min: 0 },
    period: {
      type: String,
      enum: Object.values(LATE_FINE_PERIODS),
      default: LATE_FINE_PERIODS.DAILY,
    },
    amount: { type: Number, default: 0, min: 0 },
    maxFineCap: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const discountRuleSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      default: DISCOUNT_TYPES.PERCENTAGE,
    },
    value: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, default: null },
    applicablePlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FeePlan' }],
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    requiresApproval: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

const feePlanSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    name: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    planType: {
      type: String,
      enum: Object.values(FEE_PLAN_TYPES),
      default: FEE_PLAN_TYPES.ONE_TIME,
    },
    currency: { type: String, default: 'PKR' },
    admissionFee: { type: Number, default: 0, min: 0 },
    securityFee: { type: Number, default: 0, min: 0 },
    registrationFee: { type: Number, default: 0, min: 0 },
    tuitionFee: { type: Number, default: 0, min: 0 },
    labFee: { type: Number, default: 0, min: 0 },
    otherCharges: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    scholarship: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalFee: { type: Number, default: 0, min: 0 },
    installmentCount: { type: Number, default: 1, min: 1 },
    installments: [installmentSchema],
    lateFineRule: { type: mongoose.Schema.Types.ObjectId, ref: 'LateFineRule', default: null },
    active: { type: Boolean, default: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

const admissionSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    admissionNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: Object.values(ADMISSION_TYPES),
      default: ADMISSION_TYPES.NEW,
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    feePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePlan', default: null },
    admissionDate: { type: Date, default: Date.now },
    session: { type: String, default: '' },
    counselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    referralSource: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(ADMISSION_STATUS),
      default: ADMISSION_STATUS.PENDING,
      index: true,
    },
    remarks: { type: String, default: '' },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
    feeAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFeeAccount', default: null },
    onlinePlaceholder: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

admissionSchema.index({ institute: 1, status: 1, admissionDate: -1 })

const ledgerEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, default: 0 },
    note: { type: String, default: '' },
    refType: { type: String, default: '' },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { _id: true }
)

const studentFeeAccountSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', default: null },
    feePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePlan', default: null },
    currency: { type: String, default: 'PKR' },
    totalFee: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    scholarshipAmount: { type: Number, default: 0, min: 0 },
    refundAmount: { type: Number, default: 0, min: 0 },
    fineAmount: { type: Number, default: 0, min: 0 },
    overdueAmount: { type: Number, default: 0, min: 0 },
    nextDueDate: { type: Date, default: null },
    installments: [
      {
        label: String,
        amount: Number,
        dueDate: Date,
        paidAmount: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['pending', 'partial', 'paid', 'overdue'],
          default: 'pending',
        },
        sequence: Number,
      },
    ],
    appliedDiscounts: [
      {
        rule: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscountRule' },
        name: String,
        type: String,
        amount: Number,
        appliedAt: { type: Date, default: Date.now },
      },
    ],
    ledger: [ledgerEntrySchema],
    status: {
      type: String,
      enum: ['active', 'settled', 'overdue', 'cancelled'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
)

studentFeeAccountSchema.index({ student: 1, course: 1 }, { unique: true })
studentFeeAccountSchema.index({ nextDueDate: 1, status: 1 })

const paymentSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feeAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentFeeAccount',
      required: true,
      index: true,
    },
    admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', default: null },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'PKR' },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CASH,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    paidAt: { type: Date, default: null },
    reference: { type: String, default: '' },
    notes: { type: String, default: '' },
    installmentIds: [{ type: mongoose.Schema.Types.ObjectId }],
    gatewayPlaceholder: {
      provider: { type: String, default: null },
      intentId: { type: String, default: null },
      raw: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    refundOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  },
  { timestamps: true }
)

paymentSchema.index({ institute: 1, paidAt: -1 })

const receiptSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    receiptNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: Object.values(RECEIPT_TYPES),
      default: RECEIPT_TYPES.PAYMENT,
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'PKR' },
    issuedAt: { type: Date, default: Date.now },
    qrPayload: { type: String, default: '' },
    verificationToken: { type: String, unique: true, sparse: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

const expenseSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    category: {
      type: String,
      enum: Object.values(EXPENSE_CATEGORIES),
      default: EXPENSE_CATEGORIES.MISCELLANEOUS,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'PKR' },
    expenseDate: { type: Date, default: Date.now, index: true },
    vendor: { type: String, default: '' },
    notes: { type: String, default: '' },
    attachmentUrl: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

const incomeSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    category: {
      type: String,
      enum: Object.values(INCOME_CATEGORIES),
      default: INCOME_CATEGORIES.OTHER,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'PKR' },
    incomeDate: { type: Date, default: Date.now, index: true },
    sourceRef: { type: String, default: '' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

module.exports = {
  LateFineRule: mongoose.model('LateFineRule', lateFineRuleSchema),
  DiscountRule: mongoose.model('DiscountRule', discountRuleSchema),
  FeePlan: mongoose.model('FeePlan', feePlanSchema),
  Admission: mongoose.model('Admission', admissionSchema),
  StudentFeeAccount: mongoose.model('StudentFeeAccount', studentFeeAccountSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  Receipt: mongoose.model('Receipt', receiptSchema),
  Expense: mongoose.model('Expense', expenseSchema),
  Income: mongoose.model('Income', incomeSchema),
}
