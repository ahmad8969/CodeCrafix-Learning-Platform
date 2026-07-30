const express = require('express')
const controller = require('../../controllers/communication.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const {
  mongoId,
  directChatRules,
  groupChatRules,
  messageRules,
  threadRules,
  ticketRules,
  leadRules,
  surveyRules,
  jobRules,
  searchRules,
} = require('../../validators/communication.validator')

const router = express.Router()
router.use(protect)

router.get('/search', requirePermission(COURSE_PERMISSIONS.COMM_VIEW), searchRules, validate, controller.globalSearch)

// Messaging
router.get('/messages/conversations', requirePermission(COURSE_PERMISSIONS.COMM_VIEW), controller.listConversations)
router.get('/messages/search', requirePermission(COURSE_PERMISSIONS.COMM_VIEW), controller.searchMessages)
router.post(
  '/messages/direct',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  directChatRules,
  validate,
  controller.startDirect
)
router.post(
  '/messages/groups',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  groupChatRules,
  validate,
  controller.createGroup
)
router.get(
  '/messages/conversations/:id',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  validate,
  controller.listMessages
)
router.post(
  '/messages/conversations/:id',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  messageRules,
  validate,
  controller.sendMessage
)
router.post(
  '/messages/conversations/:id/read',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  validate,
  controller.markRead
)
router.post(
  '/messages/conversations/:id/pin',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  validate,
  controller.pinMessage
)
router.post(
  '/messages/conversations/:id/archive',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  validate,
  controller.archiveConversation
)

// Forums
router.get('/forums', requirePermission(COURSE_PERMISSIONS.COMM_VIEW), controller.listThreads)
router.post(
  '/forums',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  threadRules,
  validate,
  controller.createThread
)
router.get('/forums/:id', requirePermission(COURSE_PERMISSIONS.COMM_VIEW), mongoId('id'), validate, controller.getThread)
router.post(
  '/forums/:id/replies',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  validate,
  controller.replyThread
)
router.post('/forums/:id/like', requirePermission(COURSE_PERMISSIONS.COMM_VIEW), mongoId('id'), validate, controller.likePost)
router.post(
  '/forums/:id/follow',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  validate,
  controller.followThread
)
router.post(
  '/forums/:id/best-answer',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  validate,
  controller.bestAnswer
)
router.post(
  '/forums/:id/pin',
  requirePermission(COURSE_PERMISSIONS.COMM_MANAGE),
  mongoId('id'),
  validate,
  controller.pinThread
)
router.post(
  '/forums/:id/lock',
  requirePermission(COURSE_PERMISSIONS.COMM_MANAGE),
  mongoId('id'),
  validate,
  controller.lockThread
)
router.post(
  '/forums/:id/report',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  validate,
  controller.reportPost
)

// Helpdesk
router.get('/tickets', requirePermission(COURSE_PERMISSIONS.HELPDESK_VIEW), controller.listTickets)
router.post(
  '/tickets',
  requirePermission(COURSE_PERMISSIONS.HELPDESK_VIEW),
  ticketRules,
  validate,
  controller.createTicket
)
router.get(
  '/tickets/:id',
  requirePermission(COURSE_PERMISSIONS.HELPDESK_VIEW),
  mongoId('id'),
  validate,
  controller.getTicket
)
router.post(
  '/tickets/:id/comments',
  requirePermission(COURSE_PERMISSIONS.HELPDESK_VIEW),
  mongoId('id'),
  validate,
  controller.commentTicket
)
router.patch(
  '/tickets/:id',
  requirePermission(COURSE_PERMISSIONS.HELPDESK_MANAGE),
  mongoId('id'),
  validate,
  controller.updateTicket
)
router.post(
  '/tickets/:id/reopen',
  requirePermission(COURSE_PERMISSIONS.HELPDESK_VIEW),
  mongoId('id'),
  validate,
  controller.reopenTicket
)

// CRM
router.get('/crm/leads', requirePermission(COURSE_PERMISSIONS.CRM_MANAGE), controller.listLeads)
router.post(
  '/crm/leads',
  requirePermission(COURSE_PERMISSIONS.CRM_MANAGE),
  leadRules,
  validate,
  controller.createLead
)
router.get(
  '/crm/leads/:id',
  requirePermission(COURSE_PERMISSIONS.CRM_MANAGE),
  mongoId('id'),
  validate,
  controller.getLead
)
router.patch(
  '/crm/leads/:id',
  requirePermission(COURSE_PERMISSIONS.CRM_MANAGE),
  mongoId('id'),
  validate,
  controller.updateLead
)
router.post(
  '/crm/leads/:id/follow-ups',
  requirePermission(COURSE_PERMISSIONS.CRM_MANAGE),
  mongoId('id'),
  validate,
  controller.followUpLead
)
router.post(
  '/crm/leads/:id/move',
  requirePermission(COURSE_PERMISSIONS.CRM_MANAGE),
  mongoId('id'),
  validate,
  controller.moveLead
)

// Surveys
router.get('/surveys', requirePermission(COURSE_PERMISSIONS.COMM_VIEW), controller.listSurveys)
router.post(
  '/surveys',
  requirePermission(COURSE_PERMISSIONS.COMM_MANAGE),
  surveyRules,
  validate,
  controller.createSurvey
)
router.get('/surveys/:id', requirePermission(COURSE_PERMISSIONS.COMM_VIEW), mongoId('id'), validate, controller.getSurvey)
router.patch(
  '/surveys/:id',
  requirePermission(COURSE_PERMISSIONS.COMM_MANAGE),
  mongoId('id'),
  validate,
  controller.updateSurvey
)
router.post(
  '/surveys/:id/publish',
  requirePermission(COURSE_PERMISSIONS.COMM_MANAGE),
  mongoId('id'),
  validate,
  controller.publishSurvey
)
router.post(
  '/surveys/:id/responses',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  mongoId('id'),
  validate,
  controller.submitSurvey
)
router.get(
  '/surveys/:id/analytics',
  requirePermission(COURSE_PERMISSIONS.COMM_MANAGE),
  mongoId('id'),
  validate,
  controller.surveyAnalytics
)

// Career
router.get('/career/me', requirePermission(COURSE_PERMISSIONS.CAREER_VIEW), controller.myCareer)
router.put('/career/me', requirePermission(COURSE_PERMISSIONS.CAREER_VIEW), controller.updateCareer)
router.get('/career/profiles', requirePermission(COURSE_PERMISSIONS.CAREER_MANAGE), controller.listCareers)
router.post(
  '/career/profiles/:userId/review',
  requirePermission(COURSE_PERMISSIONS.CAREER_MANAGE),
  mongoId('userId'),
  validate,
  controller.reviewCareer
)
router.get('/career/jobs', requirePermission(COURSE_PERMISSIONS.CAREER_VIEW), controller.listJobs)
router.post(
  '/career/jobs',
  requirePermission(COURSE_PERMISSIONS.CAREER_MANAGE),
  jobRules,
  validate,
  controller.createJob
)
router.get(
  '/career/jobs/:id',
  requirePermission(COURSE_PERMISSIONS.CAREER_VIEW),
  mongoId('id'),
  validate,
  controller.getJob
)
router.patch(
  '/career/jobs/:id',
  requirePermission(COURSE_PERMISSIONS.CAREER_MANAGE),
  mongoId('id'),
  validate,
  controller.updateJob
)
router.post(
  '/career/jobs/:id/apply',
  requirePermission(COURSE_PERMISSIONS.CAREER_VIEW),
  mongoId('id'),
  validate,
  controller.applyJob
)
router.get('/career/applications/me', requirePermission(COURSE_PERMISSIONS.CAREER_VIEW), controller.myApplications)

// Alumni
router.get('/alumni', requirePermission(COURSE_PERMISSIONS.CAREER_VIEW), controller.listAlumni)
router.put('/alumni/me', requirePermission(COURSE_PERMISSIONS.CAREER_VIEW), controller.upsertAlumni)
router.get('/alumni/events', requirePermission(COURSE_PERMISSIONS.CAREER_VIEW), controller.listAlumniEvents)
router.post(
  '/alumni/events',
  requirePermission(COURSE_PERMISSIONS.CAREER_MANAGE),
  controller.createAlumniEvent
)

module.exports = router
