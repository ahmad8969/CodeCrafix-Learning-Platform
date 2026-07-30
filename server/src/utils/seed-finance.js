require('dotenv').config()
const connectDB = require('../config/db')
const Course = require('../models/Course')
const Batch = require('../models/Batch')
const User = require('../models/User')
const { ROLES } = require('../constants')
const {
  FeePlan,
  DiscountRule,
  LateFineRule,
  Expense,
  Admission,
} = require('../models/Finance')
const { ADMISSION_TYPES } = require('../constants/finance')
const discountService = require('../services/discount.service')
const admissionService = require('../services/admission.service')
const ledgerService = require('../services/ledger.service')

async function seedFinance() {
  await connectDB()
  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const student = await User.findOne({ role: ROLES.STUDENT })
  const course = await Course.findOne({ slug: 'full-stack-web-bootcamp', deletedAt: null })
  const batch = await Batch.findOne({ batchCode: 'FSW-A1', deletedAt: null })
  if (!admin || !course) throw new Error('Run seed + seed:courses (+ seed:enrollment) first')

  let lateRule = await LateFineRule.findOne({ name: 'Standard daily fine' })
  if (!lateRule) {
    lateRule = await discountService.upsertLateFineRule({
      name: 'Standard daily fine',
      gracePeriodDays: 3,
      period: 'daily',
      amount: 100,
      maxFineCap: 5000,
      active: true,
    })
    console.log('Created late fine rule')
  }

  let plan = await FeePlan.findOne({ name: 'Full Stack Monthly Plan' })
  if (!plan) {
    plan = await discountService.createFeePlan(
      {
        name: 'Full Stack Monthly Plan',
        course: course._id,
        batch: batch?._id || null,
        planType: 'monthly',
        currency: 'PKR',
        admissionFee: 5000,
        registrationFee: 2000,
        tuitionFee: 45000,
        labFee: 3000,
        securityFee: 0,
        otherCharges: 0,
        discount: 0,
        scholarship: 0,
        taxPercent: 0,
        installmentCount: 3,
        lateFineRule: lateRule._id,
        active: true,
        description: 'Seed monthly installment plan',
      },
      admin._id
    )
    console.log('Created fee plan', plan.totalFee)
  } else {
    console.log('Fee plan exists')
  }

  await DiscountRule.findOneAndUpdate(
    { name: 'Early Bird 10%' },
    {
      name: 'Early Bird 10%',
      type: 'early_bird',
      value: 10,
      active: true,
      description: 'Early registration discount',
      createdBy: admin._id,
    },
    { upsert: true }
  )
  await DiscountRule.findOneAndUpdate(
    { name: 'Merit Scholarship' },
    {
      name: 'Merit Scholarship',
      type: 'scholarship',
      value: 5000,
      active: true,
      description: 'Fixed scholarship amount',
      createdBy: admin._id,
    },
    { upsert: true }
  )
  console.log('Discount rules ready')

  const expenseExists = await Expense.findOne({ title: 'Campus internet — seed' })
  if (!expenseExists) {
    await Expense.create({
      title: 'Campus internet — seed',
      category: 'internet',
      amount: 15000,
      currency: 'PKR',
      expenseDate: new Date(),
      vendor: 'ISP',
      createdBy: admin._id,
    })
    await Expense.create({
      title: 'Marketing ads — seed',
      category: 'marketing',
      amount: 8000,
      currency: 'PKR',
      expenseDate: new Date(),
      createdBy: admin._id,
    })
    console.log('Sample expenses created')
  }

  if (student) {
    let admission = await Admission.findOne({
      student: student._id,
      course: course._id,
    })
    if (!admission) {
      admission = await admissionService.createAdmission(
        {
          student: student._id,
          course: course._id,
          batch: batch?._id || null,
          feePlan: plan._id,
          type: ADMISSION_TYPES.NEW,
          session: '2026-A',
          referralSource: 'seed',
          remarks: 'Seeded admission',
        },
        admin._id
      )
      console.log('Created admission', admission.admissionNumber)
    }

    if (admission.status === 'pending') {
      admission = await admissionService.approveAdmission(admission._id, admin._id)
      console.log('Approved admission + fee account')
    }

    const accountId = admission.feeAccount?._id || admission.feeAccount
    if (accountId) {
      const account = await ledgerService.getAccount(accountId)
      if ((account.paidAmount || 0) === 0) {
        await ledgerService.recordPayment(
          {
            feeAccountId: account._id,
            amount: Math.min(10000, account.remainingAmount || 10000),
            method: 'cash',
            status: 'paid',
            forcePaid: true,
            reference: 'SEED-PAY-001',
            notes: 'Seed payment',
          },
          admin._id
        )
        console.log('Recorded sample payment + receipt')
      }
    }
  }

  console.log('seed:finance complete')
  process.exit(0)
}

seedFinance().catch((err) => {
  console.error(err)
  process.exit(1)
})
