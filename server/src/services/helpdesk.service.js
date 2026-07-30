const { Ticket } = require('../models/Communication')
const notificationService = require('./notification.service')
const {
  TICKET_STATUS,
  TICKET_PRIORITY,
  COMM_NOTIFY,
} = require('../constants/communication')
const { ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')

function ticketNumber() {
  return `TKT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

function isStaff(role) {
  return [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(role)
}

async function listTickets(filters = {}, reqUser) {
  const q = {}
  if (reqUser.role === ROLES.STUDENT) q.student = reqUser._id
  else if (filters.studentId) q.student = filters.studentId
  if (filters.status) q.status = filters.status
  if (filters.category) q.category = filters.category
  if (filters.priority) q.priority = filters.priority
  if (filters.assigneeId) q.assignee = filters.assigneeId
  if (filters.q) {
    q.$or = [
      { subject: new RegExp(filters.q, 'i') },
      { ticketNumber: new RegExp(filters.q, 'i') },
    ]
  }
  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(50, Number(filters.limit) || 20)
  const [items, total] = await Promise.all([
    Ticket.find(q)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'fullName email')
      .populate('assignee', 'fullName')
      .lean(),
    Ticket.countDocuments(q),
  ])
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
}

async function getTicket(id, reqUser) {
  const doc = await Ticket.findById(id)
    .populate('student', 'fullName email')
    .populate('assignee', 'fullName email')
    .populate('timeline.by', 'fullName role')
    .lean()
  if (!doc) throw new ApiError(404, 'Ticket not found')
  if (
    reqUser.role === ROLES.STUDENT &&
    String(doc.student._id || doc.student) !== String(reqUser._id)
  ) {
    throw new ApiError(403, 'Forbidden')
  }
  if (!isStaff(reqUser.role)) {
    return {
      ...doc,
      timeline: (doc.timeline || []).filter((entry) => !entry.internal),
    }
  }
  return doc
}

async function createTicket(payload, userId) {
  const due = new Date()
  due.setHours(due.getHours() + 24)
  const doc = await Ticket.create({
    ticketNumber: ticketNumber(),
    student: userId,
    category: payload.category,
    subject: payload.subject,
    description: payload.description || '',
    priority: payload.priority || TICKET_PRIORITY.MEDIUM,
    attachments: payload.attachments || [],
    course: payload.courseId || null,
    slaPlaceholder: { responseDueAt: due, resolveDueAt: null },
    timeline: [
      {
        at: new Date(),
        by: userId,
        type: 'created',
        note: 'Ticket opened',
        internal: false,
      },
    ],
  })
  return getTicket(doc._id, { _id: userId, role: ROLES.STUDENT })
}

async function addComment(id, { note, internal = false, attachments = [], status }, userId, role) {
  const doc = await Ticket.findById(id)
  if (!doc) throw new ApiError(404, 'Ticket not found')
  if (role === ROLES.STUDENT && String(doc.student) !== String(userId)) {
    throw new ApiError(403, 'Forbidden')
  }
  if (internal && !isStaff(role)) throw new ApiError(403, 'Internal notes are staff-only')

  doc.timeline.push({
    at: new Date(),
    by: userId,
    type: internal ? 'internal_note' : 'comment',
    note: note || '',
    internal: Boolean(internal),
    attachments,
  })
  if (status && isStaff(role)) doc.status = status
  else if (!internal && role === ROLES.STUDENT && doc.status === TICKET_STATUS.WAITING) {
    doc.status = TICKET_STATUS.IN_PROGRESS
  } else if (!internal && isStaff(role) && doc.status === TICKET_STATUS.OPEN) {
    doc.status = TICKET_STATUS.IN_PROGRESS
  }
  await doc.save()

  const notifyId = String(doc.student) === String(userId) ? doc.assignee : doc.student
  if (notifyId) {
    await notificationService.notifyUser({
      userId: notifyId,
      templateKey: COMM_NOTIFY.TICKET_UPDATE,
      title: `Ticket ${doc.ticketNumber} updated`,
      body: note?.slice(0, 140) || `Status: ${doc.status}`,
      link: `/helpdesk/${doc._id}`,
      meta: { ticketId: doc._id },
    })
  }
  return getTicket(id, { _id: userId, role })
}

async function updateTicket(id, payload, role) {
  if (!isStaff(role)) throw new ApiError(403, 'Staff only')
  const updates = {}
  for (const k of ['status', 'priority', 'assignee', 'category']) {
    if (payload[k] !== undefined) updates[k] = payload[k]
  }
  if (payload.status === TICKET_STATUS.RESOLVED) updates.resolvedAt = new Date()
  if (payload.status === TICKET_STATUS.CLOSED) updates.closedAt = new Date()
  const doc = await Ticket.findByIdAndUpdate(
    id,
    {
      ...updates,
      $push: {
        timeline: {
          at: new Date(),
          type: 'status_change',
          note: `Updated: ${JSON.stringify(updates)}`,
          internal: true,
        },
      },
    },
    { new: true }
  )
  if (!doc) throw new ApiError(404, 'Ticket not found')
  if (doc.student) {
    await notificationService.notifyUser({
      userId: doc.student,
      templateKey: COMM_NOTIFY.TICKET_UPDATE,
      title: `Ticket ${doc.ticketNumber} updated`,
      body: `Status is now ${doc.status}`,
      link: `/helpdesk/${doc._id}`,
      meta: { ticketId: doc._id },
    })
  }
  return doc
}

async function reopenTicket(id, userId, role) {
  const doc = await Ticket.findById(id)
  if (!doc) throw new ApiError(404, 'Ticket not found')
  if (role === ROLES.STUDENT && String(doc.student) !== String(userId)) {
    throw new ApiError(403, 'Forbidden')
  }
  if (![TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED].includes(doc.status)) {
    throw new ApiError(400, 'Only resolved/closed tickets can be reopened')
  }
  doc.status = TICKET_STATUS.OPEN
  doc.resolvedAt = null
  doc.closedAt = null
  doc.timeline.push({
    at: new Date(),
    by: userId,
    type: 'reopened',
    note: 'Ticket reopened',
    internal: false,
  })
  await doc.save()
  return getTicket(id, { _id: userId, role })
}

module.exports = {
  listTickets,
  getTicket,
  createTicket,
  addComment,
  updateTicket,
  reopenTicket,
}
