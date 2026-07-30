const {
  Admission,
  FeePlan,
  StudentFeeAccount,
  Payment,
  Receipt,
  Expense,
  Income,
} = require('../models/Finance')

module.exports = {
  findAdmission: (id) => Admission.findById(id),
  findFeePlan: (id) => FeePlan.findById(id),
  findFeeAccount: (id) => StudentFeeAccount.findById(id),
  findPayment: (id) => Payment.findById(id),
  findReceipt: (id) => Receipt.findById(id),
  listExpenses: (filter) => Expense.find(filter),
  listIncome: (filter) => Income.find(filter),
}
