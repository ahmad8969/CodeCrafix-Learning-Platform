const messagingService = require('../services/messaging.service')
const forumService = require('../services/forum.service')
const helpdeskService = require('../services/helpdesk.service')
const crmService = require('../services/crm.service')
const surveyService = require('../services/survey.service')
const careerService = require('../services/career.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')

// Messaging
const listConversations = asyncHandler(async (req, res) => {
  sendSuccess(res, await messagingService.listConversations(req.user._id))
})
const startDirect = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await messagingService.getOrCreateDirect(req.user._id, req.body.userId, req.user.role),
    'Conversation ready',
    201
  )
})
const createGroup = asyncHandler(async (req, res) => {
  const data = await messagingService.createGroup(req.body, req.user._id)
  await auditService.record(req, {
    action: 'conversation_created',
    resourceType: 'Conversation',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Group created', 201)
})
const listMessages = asyncHandler(async (req, res) => {
  sendSuccess(res, await messagingService.listMessages(req.params.id, req.user._id, req.query))
})
const sendMessage = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await messagingService.sendMessage(req.params.id, req.user._id, req.body),
    'Sent',
    201
  )
})
const markRead = asyncHandler(async (req, res) => {
  sendSuccess(res, await messagingService.markRead(req.params.id, req.user._id))
})
const pinMessage = asyncHandler(async (req, res) => {
  sendSuccess(res, await messagingService.pinMessage(req.params.id, req.body.messageId, req.user._id))
})
const archiveConversation = asyncHandler(async (req, res) => {
  sendSuccess(res, await messagingService.archiveConversation(req.params.id, req.user._id))
})
const searchMessages = asyncHandler(async (req, res) => {
  sendSuccess(res, await messagingService.globalSearchMessages(req.user._id, req.query.q))
})

// Forum
const listThreads = asyncHandler(async (req, res) => {
  sendSuccess(res, await forumService.listThreads(req.query))
})
const getThread = asyncHandler(async (req, res) => {
  sendSuccess(res, await forumService.getThread(req.params.id))
})
const createThread = asyncHandler(async (req, res) => {
  const data = await forumService.createThread(req.body, req.user._id)
  await auditService.record(req, {
    action: 'forum_thread_created',
    resourceType: 'Discussion',
    resourceId: data.thread?._id,
  })
  sendSuccess(res, data, 'Thread created', 201)
})
const replyThread = asyncHandler(async (req, res) => {
  sendSuccess(res, await forumService.reply(req.params.id, req.body, req.user._id), 'Reply posted', 201)
})
const likePost = asyncHandler(async (req, res) => {
  sendSuccess(res, await forumService.toggleLike(req.params.id, req.user._id))
})
const followThread = asyncHandler(async (req, res) => {
  sendSuccess(res, await forumService.followThread(req.params.id, req.user._id))
})
const bestAnswer = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await forumService.markBestAnswer(req.params.id, req.body.replyId, req.user._id, req.user.role)
  )
})
const pinThread = asyncHandler(async (req, res) => {
  sendSuccess(res, await forumService.pinThread(req.params.id, req.user.role))
})
const lockThread = asyncHandler(async (req, res) => {
  sendSuccess(res, await forumService.lockThread(req.params.id, req.user.role))
})
const reportPost = asyncHandler(async (req, res) => {
  sendSuccess(res, await forumService.reportContent(req.params.id, req.user._id))
})

// Helpdesk
const listTickets = asyncHandler(async (req, res) => {
  sendSuccess(res, await helpdeskService.listTickets(req.query, req.user))
})
const getTicket = asyncHandler(async (req, res) => {
  sendSuccess(res, await helpdeskService.getTicket(req.params.id, req.user))
})
const createTicket = asyncHandler(async (req, res) => {
  const data = await helpdeskService.createTicket(req.body, req.user._id)
  await auditService.record(req, {
    action: 'ticket_created',
    resourceType: 'Ticket',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Ticket created', 201)
})
const commentTicket = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await helpdeskService.addComment(req.params.id, req.body, req.user._id, req.user.role)
  )
})
const updateTicket = asyncHandler(async (req, res) => {
  const data = await helpdeskService.updateTicket(req.params.id, req.body, req.user.role)
  await auditService.record(req, {
    action: 'ticket_updated',
    resourceType: 'Ticket',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Ticket updated')
})
const reopenTicket = asyncHandler(async (req, res) => {
  sendSuccess(res, await helpdeskService.reopenTicket(req.params.id, req.user._id, req.user.role))
})

// CRM
const listLeads = asyncHandler(async (req, res) => {
  sendSuccess(res, await crmService.listLeads(req.query))
})
const getLead = asyncHandler(async (req, res) => {
  sendSuccess(res, await crmService.getLead(req.params.id))
})
const createLead = asyncHandler(async (req, res) => {
  const data = await crmService.createLead(req.body, req.user._id)
  await auditService.record(req, {
    action: 'crm_lead_created',
    resourceType: 'CrmLead',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Lead created', 201)
})
const updateLead = asyncHandler(async (req, res) => {
  sendSuccess(res, await crmService.updateLead(req.params.id, req.body), 'Lead updated')
})
const followUpLead = asyncHandler(async (req, res) => {
  sendSuccess(res, await crmService.addFollowUp(req.params.id, req.body, req.user._id))
})
const moveLead = asyncHandler(async (req, res) => {
  sendSuccess(res, await crmService.moveStage(req.params.id, req.body.stage))
})

// Surveys
const listSurveys = asyncHandler(async (req, res) => {
  sendSuccess(res, await surveyService.listSurveys(req.query, req.user))
})
const getSurvey = asyncHandler(async (req, res) => {
  sendSuccess(res, await surveyService.getSurvey(req.params.id, req.user))
})
const createSurvey = asyncHandler(async (req, res) => {
  sendSuccess(res, await surveyService.createSurvey(req.body, req.user._id), 'Survey created', 201)
})
const updateSurvey = asyncHandler(async (req, res) => {
  sendSuccess(res, await surveyService.updateSurvey(req.params.id, req.body), 'Survey updated')
})
const publishSurvey = asyncHandler(async (req, res) => {
  sendSuccess(res, await surveyService.publishSurvey(req.params.id), 'Survey published')
})
const submitSurvey = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await surveyService.submitResponse(req.params.id, req.user._id, req.body.answers),
    'Response saved'
  )
})
const surveyAnalytics = asyncHandler(async (req, res) => {
  sendSuccess(res, await surveyService.analytics(req.params.id))
})

// Career / Jobs / Alumni
const myCareer = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.getMyCareer(req.user._id))
})
const updateCareer = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.updateCareer(req.user._id, req.body), 'Profile saved')
})
const listCareers = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.listCareers(req.query))
})
const reviewCareer = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await careerService.reviewCareer(req.params.userId, req.body, req.user._id),
    'Reviewed'
  )
})
const listJobs = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.listJobs(req.query))
})
const getJob = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.getJob(req.params.id))
})
const createJob = asyncHandler(async (req, res) => {
  const data = await careerService.createJob(req.body, req.user._id)
  await auditService.record(req, {
    action: 'job_created',
    resourceType: 'JobPosting',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Job created', 201)
})
const updateJob = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.updateJob(req.params.id, req.body), 'Job updated')
})
const applyJob = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.applyToJob(req.params.id, req.user._id, req.body), 'Applied')
})
const myApplications = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.myApplications(req.user._id))
})
const listAlumni = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.listAlumni(req.query))
})
const upsertAlumni = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.upsertAlumni(req.user._id, req.body), 'Alumni profile saved')
})
const listAlumniEvents = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.listAlumniEvents())
})
const createAlumniEvent = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await careerService.createAlumniEvent(req.body, req.user._id),
    'Event created',
    201
  )
})
const globalSearch = asyncHandler(async (req, res) => {
  sendSuccess(res, await careerService.globalSearch(req.query))
})

module.exports = {
  listConversations,
  startDirect,
  createGroup,
  listMessages,
  sendMessage,
  markRead,
  pinMessage,
  archiveConversation,
  searchMessages,
  listThreads,
  getThread,
  createThread,
  replyThread,
  likePost,
  followThread,
  bestAnswer,
  pinThread,
  lockThread,
  reportPost,
  listTickets,
  getTicket,
  createTicket,
  commentTicket,
  updateTicket,
  reopenTicket,
  listLeads,
  getLead,
  createLead,
  updateLead,
  followUpLead,
  moveLead,
  listSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  publishSurvey,
  submitSurvey,
  surveyAnalytics,
  myCareer,
  updateCareer,
  listCareers,
  reviewCareer,
  listJobs,
  getJob,
  createJob,
  updateJob,
  applyJob,
  myApplications,
  listAlumni,
  upsertAlumni,
  listAlumniEvents,
  createAlumniEvent,
  globalSearch,
}
