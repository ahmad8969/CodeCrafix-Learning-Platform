import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

export const financeService = {
  dashboard: async () => unwrap(await api.get('/finance/dashboard')),
  teacherStatus: async (params) => unwrap(await api.get('/finance/teacher/status', { params })),

  listAdmissions: async (params) => unwrap(await api.get('/finance/admissions', { params })),
  getAdmission: async (id) => unwrap(await api.get(`/finance/admissions/${id}`)),
  createAdmission: async (payload) => unwrap(await api.post('/finance/admissions', payload)),
  updateAdmission: async (id, payload) =>
    unwrap(await api.patch(`/finance/admissions/${id}`, payload)),
  approveAdmission: async (id) => unwrap(await api.post(`/finance/admissions/${id}/approve`)),
  rejectAdmission: async (id, reason) =>
    unwrap(await api.post(`/finance/admissions/${id}/reject`, { reason })),
  cancelAdmission: async (id) => unwrap(await api.post(`/finance/admissions/${id}/cancel`)),

  listFeePlans: async (params) => unwrap(await api.get('/finance/fee-plans', { params })),
  getFeePlan: async (id) => unwrap(await api.get(`/finance/fee-plans/${id}`)),
  createFeePlan: async (payload) => unwrap(await api.post('/finance/fee-plans', payload)),
  updateFeePlan: async (id, payload) =>
    unwrap(await api.patch(`/finance/fee-plans/${id}`, payload)),
  deleteFeePlan: async (id) => unwrap(await api.delete(`/finance/fee-plans/${id}`)),

  listDiscounts: async (params) => unwrap(await api.get('/finance/discounts', { params })),
  upsertDiscount: async (payload) => unwrap(await api.post('/finance/discounts', payload)),
  applyDiscount: async (payload) => unwrap(await api.post('/finance/discounts/apply', payload)),
  listLateFines: async (params) => unwrap(await api.get('/finance/late-fines', { params })),
  upsertLateFine: async (payload) => unwrap(await api.post('/finance/late-fines', payload)),

  myLedger: async (params) => unwrap(await api.get('/finance/ledger/me', { params })),
  studentLedger: async (studentId, params) =>
    unwrap(await api.get(`/finance/ledger/students/${studentId}`, { params })),
  getAccount: async (id) => unwrap(await api.get(`/finance/accounts/${id}`)),

  listPayments: async (params) => unwrap(await api.get('/finance/payments', { params })),
  recordPayment: async (payload) => unwrap(await api.post('/finance/payments', payload)),
  confirmPayment: async (id) => unwrap(await api.post(`/finance/payments/${id}/confirm`)),
  refundPayment: async (id, payload) =>
    unwrap(await api.post(`/finance/payments/${id}/refund`, payload)),

  listReceipts: async (params) => unwrap(await api.get('/finance/receipts', { params })),
  getReceipt: async (id) => unwrap(await api.get(`/finance/receipts/${id}`)),
  verifyReceipt: async (token) => unwrap(await api.get(`/finance/receipts/verify/${token}`)),

  listExpenses: async (params) => unwrap(await api.get('/finance/expenses', { params })),
  createExpense: async (payload) => unwrap(await api.post('/finance/expenses', payload)),
  updateExpense: async (id, payload) =>
    unwrap(await api.patch(`/finance/expenses/${id}`, payload)),
  deleteExpense: async (id) => unwrap(await api.delete(`/finance/expenses/${id}`)),

  listIncome: async (params) => unwrap(await api.get('/finance/income', { params })),
  createIncome: async (payload) => unwrap(await api.post('/finance/income', payload)),
  updateIncome: async (id, payload) => unwrap(await api.patch(`/finance/income/${id}`, payload)),
  deleteIncome: async (id) => unwrap(await api.delete(`/finance/income/${id}`)),

  reportDaily: async (params) => unwrap(await api.get('/finance/reports/daily', { params })),
  reportMonthly: async (params) => unwrap(await api.get('/finance/reports/monthly', { params })),
  reportOutstanding: async () => unwrap(await api.get('/finance/reports/outstanding')),
  reportExpenses: async (params) => unwrap(await api.get('/finance/reports/expenses', { params })),
  reportPnL: async (params) => unwrap(await api.get('/finance/reports/pnl', { params })),
  exportReport: async (type, format = 'csv') => {
    const response = await api.get(`/finance/reports/export/${type}`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },
  sendReminders: async () => unwrap(await api.post('/finance/reminders/due')),
}
