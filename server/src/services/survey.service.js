const { Survey, SurveyResponse } = require('../models/Communication')
const notificationService = require('./notification.service')
const { COMM_NOTIFY } = require('../constants/communication')
const { ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')
const User = require('../models/User')

async function listSurveys(filters = {}, reqUser = null) {
  const q = {}
  const canManage =
    reqUser && [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(reqUser.role)
  if (filters.status) q.status = filters.status
  else if (!canManage) q.status = 'published'
  if (filters.type) q.type = filters.type
  if (filters.courseId) q.course = filters.courseId
  return Survey.find(q)
    .sort({ createdAt: -1 })
    .populate('course', 'title')
    .populate('teacher', 'fullName')
    .lean()
}

async function getSurvey(id, reqUser = null) {
  const doc = await Survey.findById(id)
    .populate('course', 'title')
    .populate('teacher', 'fullName')
    .lean()
  if (!doc) throw new ApiError(404, 'Survey not found')
  const canManage =
    reqUser && [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(reqUser.role)
  if (!canManage && doc.status !== 'published') throw new ApiError(404, 'Survey not found')
  return doc
}

async function createSurvey(payload, userId) {
  return Survey.create({ ...payload, createdBy: userId, status: payload.status || 'draft' })
}

async function updateSurvey(id, payload) {
  const doc = await Survey.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
  if (!doc) throw new ApiError(404, 'Survey not found')
  return doc
}

async function publishSurvey(id) {
  const doc = await Survey.findByIdAndUpdate(
    id,
    { status: 'published', publishedAt: new Date() },
    { new: true }
  )
  if (!doc) throw new ApiError(404, 'Survey not found')

  const students = await User.find({ role: ROLES.STUDENT }).select('_id').limit(200).lean()
  await Promise.all(
    students.slice(0, 50).map((s) =>
      notificationService.notifyUser({
        userId: s._id,
        templateKey: COMM_NOTIFY.SURVEY_PUBLISHED,
        title: 'New survey available',
        body: doc.title,
        link: `/surveys/${doc._id}`,
        meta: { surveyId: doc._id },
      })
    )
  )
  return doc
}

async function submitResponse(surveyId, userId, answers) {
  const survey = await Survey.findById(surveyId)
  if (!survey || survey.status !== 'published') throw new ApiError(400, 'Survey not open')
  return SurveyResponse.findOneAndUpdate(
    { survey: surveyId, respondent: userId },
    { answers: answers || [] },
    { upsert: true, new: true }
  )
}

async function analytics(surveyId) {
  const survey = await getSurvey(surveyId)
  const responses = await SurveyResponse.find({ survey: surveyId }).lean()
  const byQuestion = {}
  for (const q of survey.questions || []) {
    const vals = responses
      .map((r) => r.answers.find((a) => a.questionKey === q.key)?.value)
      .filter((v) => v != null)
    if (q.type === 'rating') {
      const nums = vals.map(Number).filter((n) => !Number.isNaN(n))
      const avg = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0
      byQuestion[q.key] = {
        type: q.type,
        average: Math.round(avg * 10) / 10,
        count: nums.length,
        prompt: q.prompt,
      }
    } else if (q.type === 'yes_no') {
      const yes = vals.filter((v) => v === true || v === 'yes' || v === 'Yes').length
      byQuestion[q.key] = {
        type: q.type,
        yes,
        no: vals.length - yes,
        count: vals.length,
        prompt: q.prompt,
      }
    } else {
      byQuestion[q.key] = { type: q.type, count: vals.length, prompt: q.prompt, samples: vals.slice(0, 10) }
    }
  }
  const ratingQs = Object.values(byQuestion).filter((x) => x.type === 'rating' && x.count)
  const satisfactionScore = ratingQs.length
    ? Math.round(
        (ratingQs.reduce((s, x) => s + x.average, 0) / ratingQs.length / 5) * 1000
      ) / 10
    : null
  return {
    surveyId,
    responseCount: responses.length,
    byQuestion,
    satisfactionScore,
    npsPlaceholder: null,
    trendPlaceholder: [],
  }
}

module.exports = {
  listSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  publishSurvey,
  submitResponse,
  analytics,
}
