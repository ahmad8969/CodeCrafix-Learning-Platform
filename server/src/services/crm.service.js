const { CrmLead } = require('../models/Communication')
const { CRM_STAGES } = require('../constants/communication')
const { ApiError } = require('../utils/helpers')

async function listLeads(filters = {}) {
  const q = {}
  if (filters.stage) q.stage = filters.stage
  if (filters.counselorId) q.counselor = filters.counselorId
  if (filters.q) {
    q.$or = [
      { fullName: new RegExp(filters.q, 'i') },
      { email: new RegExp(filters.q, 'i') },
      { phone: new RegExp(filters.q, 'i') },
    ]
  }
  const items = await CrmLead.find(q)
    .sort({ updatedAt: -1 })
    .populate('counselor', 'fullName')
    .populate('interestedCourse', 'title')
    .populate('linkedUser', 'fullName email')
    .lean()

  const board = {}
  for (const stage of Object.values(CRM_STAGES)) board[stage] = []
  for (const lead of items) {
    const key = lead.stage || CRM_STAGES.LEAD
    if (!board[key]) board[key] = []
    board[key].push(lead)
  }
  return { items, board, stages: Object.values(CRM_STAGES) }
}

async function getLead(id) {
  const doc = await CrmLead.findById(id)
    .populate('counselor', 'fullName email')
    .populate('interestedCourse', 'title')
    .populate('followUps.by', 'fullName')
    .lean()
  if (!doc) throw new ApiError(404, 'Lead not found')
  return doc
}

async function createLead(payload, userId) {
  return CrmLead.create({
    ...payload,
    counselor: payload.counselor || userId,
    stage: payload.stage || CRM_STAGES.LEAD,
  })
}

async function updateLead(id, payload) {
  const allowed = [
    'fullName',
    'email',
    'phone',
    'source',
    'counselor',
    'stage',
    'interestedCourse',
    'linkedUser',
    'conversionStatus',
    'notes',
    'parentContact',
  ]
  const updates = {}
  for (const k of allowed) {
    if (payload[k] !== undefined) updates[k] = payload[k]
  }
  const doc = await CrmLead.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
  if (!doc) throw new ApiError(404, 'Lead not found')
  return doc
}

async function addFollowUp(id, { note, nextFollowUpAt }, userId) {
  const doc = await CrmLead.findByIdAndUpdate(
    id,
    {
      $push: {
        followUps: {
          at: new Date(),
          by: userId,
          note: note || '',
          nextFollowUpAt: nextFollowUpAt || null,
        },
      },
    },
    { new: true }
  )
  if (!doc) throw new ApiError(404, 'Lead not found')
  return getLead(id)
}

async function moveStage(id, stage) {
  if (!Object.values(CRM_STAGES).includes(stage)) throw new ApiError(400, 'Invalid stage')
  const doc = await CrmLead.findByIdAndUpdate(id, { stage }, { new: true })
  if (!doc) throw new ApiError(404, 'Lead not found')
  return doc
}

module.exports = {
  listLeads,
  getLead,
  createLead,
  updateLead,
  addFollowUp,
  moveStage,
  CRM_STAGES,
}
