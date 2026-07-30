const { Conversation, ChatMessage } = require('../models/Communication')
const notificationService = require('./notification.service')
const { CHAT_TYPES, COMM_NOTIFY } = require('../constants/communication')
const { ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')

function canMessage(senderRole, recipientRole) {
  if (senderRole === ROLES.ADMIN || senderRole === ROLES.SUPER_ADMIN) return true
  if (senderRole === ROLES.TEACHER) return true
  if (senderRole === ROLES.STUDENT) {
    return [ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.STUDENT].includes(recipientRole)
  }
  return false
}

async function listConversations(userId) {
  return Conversation.find({
    participants: userId,
    archivedBy: { $ne: userId },
  })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'fullName email role profileImage')
    .populate('course', 'title')
    .populate('batch', 'name batchCode')
    .lean()
}

async function getOrCreateDirect(userId, otherUserId, senderRole) {
  if (String(userId) === String(otherUserId)) throw new ApiError(400, 'Invalid participant')
  const User = require('../models/User')
  const other = await User.findById(otherUserId).select('role')
  if (!other) throw new ApiError(404, 'User not found')
  if (!canMessage(senderRole, other.role)) throw new ApiError(403, 'Messaging not allowed')

  let conv = await Conversation.findOne({
    type: CHAT_TYPES.DIRECT,
    participants: { $all: [userId, otherUserId], $size: 2 },
  })
  if (!conv) {
    conv = await Conversation.create({
      type: CHAT_TYPES.DIRECT,
      participants: [userId, otherUserId],
      createdBy: userId,
    })
  }
  return Conversation.findById(conv._id)
    .populate('participants', 'fullName email role profileImage')
    .lean()
}

async function createGroup(payload, userId) {
  const type = payload.type || CHAT_TYPES.GROUP
  const participants = [...new Set([String(userId), ...(payload.participantIds || []).map(String)])]
  if (participants.length < 2 && type !== CHAT_TYPES.BROADCAST) {
    throw new ApiError(400, 'At least two participants required')
  }
  const conv = await Conversation.create({
    type,
    title: payload.title || '',
    participants,
    course: payload.courseId || null,
    batch: payload.batchId || null,
    createdBy: userId,
  })
  return Conversation.findById(conv._id)
    .populate('participants', 'fullName email role profileImage')
    .lean()
}

async function assertParticipant(conversationId, userId) {
  const conv = await Conversation.findById(conversationId)
  if (!conv) throw new ApiError(404, 'Conversation not found')
  if (!conv.participants.some((p) => String(p) === String(userId))) {
    throw new ApiError(403, 'Not a participant')
  }
  return conv
}

async function listMessages(conversationId, userId, { q, limit = 50, before } = {}) {
  await assertParticipant(conversationId, userId)
  const filter = { conversation: conversationId, deletedAt: null }
  if (q) filter.$text = { $search: q }
  if (before) filter.createdAt = { $lt: new Date(before) }
  return ChatMessage.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(100, Number(limit) || 50))
    .populate('sender', 'fullName role profileImage')
    .lean()
}

async function sendMessage(conversationId, userId, { body, attachments = [] }) {
  const conv = await assertParticipant(conversationId, userId)
  if (!body && !(attachments && attachments.length)) {
    throw new ApiError(400, 'Message body or attachment required')
  }
  const msg = await ChatMessage.create({
    conversation: conversationId,
    sender: userId,
    body: body || '',
    attachments,
    readBy: [userId],
  })
  conv.lastMessageAt = new Date()
  conv.lastMessagePreview = (body || 'Attachment').slice(0, 140)
  await conv.save()

  const others = conv.participants.filter((p) => String(p) !== String(userId))
  await Promise.all(
    others.map((uid) =>
      notificationService.notifyUser({
        userId: uid,
        templateKey: COMM_NOTIFY.NEW_MESSAGE,
        title: 'New message',
        body: conv.lastMessagePreview,
        link: '/messages',
        meta: { conversationId, messageId: msg._id },
      })
    )
  )

  return ChatMessage.findById(msg._id).populate('sender', 'fullName role profileImage').lean()
}

async function markRead(conversationId, userId) {
  await assertParticipant(conversationId, userId)
  await ChatMessage.updateMany(
    { conversation: conversationId, readBy: { $ne: userId }, deletedAt: null },
    { $addToSet: { readBy: userId } }
  )
  return { ok: true }
}

async function pinMessage(conversationId, messageId, userId) {
  const conv = await assertParticipant(conversationId, userId)
  const msg = await ChatMessage.findOne({ _id: messageId, conversation: conversationId })
  if (!msg) throw new ApiError(404, 'Message not found')
  msg.pinned = true
  await msg.save()
  await Conversation.findByIdAndUpdate(conversationId, {
    $addToSet: { pinnedMessageIds: messageId },
  })
  return msg
}

async function archiveConversation(conversationId, userId) {
  await assertParticipant(conversationId, userId)
  await Conversation.findByIdAndUpdate(conversationId, { $addToSet: { archivedBy: userId } })
  return { archived: true }
}

async function globalSearchMessages(userId, q) {
  if (!q) return []
  const convIds = await Conversation.find({ participants: userId }).distinct('_id')
  return ChatMessage.find({
    conversation: { $in: convIds },
    deletedAt: null,
    body: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('sender', 'fullName')
    .populate('conversation', 'title type')
    .lean()
}

module.exports = {
  listConversations,
  getOrCreateDirect,
  createGroup,
  listMessages,
  sendMessage,
  markRead,
  pinMessage,
  archiveConversation,
  globalSearchMessages,
  CHAT_TYPES,
}
