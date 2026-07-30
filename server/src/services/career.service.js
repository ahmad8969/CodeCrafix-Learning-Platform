const {
  CareerProfile,
  JobPosting,
  JobApplication,
  AlumniProfile,
  AlumniEvent,
} = require('../models/Communication')
const notificationService = require('./notification.service')
const { APPLICATION_STATUS, COMM_NOTIFY } = require('../constants/communication')
const { ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')

async function getMyCareer(userId) {
  let profile = await CareerProfile.findOne({ user: userId }).lean()
  if (!profile) {
    profile = await CareerProfile.create({ user: userId })
    profile = profile.toObject()
  }
  return profile
}

async function updateCareer(userId, payload) {
  const allowed = [
    'headline',
    'summary',
    'skills',
    'experience',
    'education',
    'certifications',
    'socialLinks',
    'resumeUrl',
    'freelanceHub',
  ]
  const updates = {}
  for (const k of allowed) {
    if (payload[k] !== undefined) updates[k] = payload[k]
  }
  if (payload.submitForReview) updates.status = 'pending_review'
  return CareerProfile.findOneAndUpdate(
    { user: userId },
    { $set: updates, $setOnInsert: { user: userId } },
    { upsert: true, new: true }
  )
}

async function reviewCareer(profileUserId, { status, verifiedSkills, recommend }, actorId) {
  const updates = {}
  if (status) updates.status = status
  if (verifiedSkills) updates.verifiedSkills = verifiedSkills
  const ops = { $set: updates }
  if (recommend) ops.$addToSet = { recommendedBy: actorId }
  const doc = await CareerProfile.findOneAndUpdate({ user: profileUserId }, ops, { new: true })
  if (!doc) throw new ApiError(404, 'Profile not found')
  return doc
}

async function listCareers(filters = {}) {
  const q = {}
  if (filters.status) q.status = filters.status
  return CareerProfile.find(q)
    .populate('user', 'fullName email profileImage')
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean()
}

async function listJobs(filters = {}) {
  const q = { status: filters.status || 'published' }
  if (filters.type) q.type = filters.type
  if (filters.q) {
    q.$or = [
      { title: new RegExp(filters.q, 'i') },
      { company: new RegExp(filters.q, 'i') },
      { skillsRequired: new RegExp(filters.q, 'i') },
    ]
  }
  return JobPosting.find(q).sort({ createdAt: -1 }).lean()
}

async function getJob(id) {
  const job = await JobPosting.findById(id).lean()
  if (!job) throw new ApiError(404, 'Job not found')
  return job
}

async function createJob(payload, userId) {
  const job = await JobPosting.create({ ...payload, createdBy: userId })
  if (job.status === 'published') {
    const User = require('../models/User')
    const students = await User.find({ role: ROLES.STUDENT }).select('_id').limit(40).lean()
    await Promise.all(
      students.map((s) =>
        notificationService.notifyUser({
          userId: s._id,
          templateKey: COMM_NOTIFY.JOB_POSTED,
          title: 'New job posted',
          body: `${job.title} at ${job.company}`,
          link: `/career/jobs/${job._id}`,
          meta: { jobId: job._id },
        })
      )
    )
  }
  return job
}

async function updateJob(id, payload) {
  const doc = await JobPosting.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
  if (!doc) throw new ApiError(404, 'Job not found')
  return doc
}

async function applyToJob(jobId, userId, { coverNote, bookmarkOnly } = {}) {
  const job = await JobPosting.findById(jobId)
  if (!job || job.status !== 'published') throw new ApiError(400, 'Job not available')
  if (bookmarkOnly) {
    return JobApplication.findOneAndUpdate(
      { job: jobId, student: userId },
      {
        $set: { bookmarked: true },
        $setOnInsert: {
          status: APPLICATION_STATUS.SAVED,
          appliedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    )
  }
  return JobApplication.findOneAndUpdate(
    { job: jobId, student: userId },
    {
      status: APPLICATION_STATUS.APPLIED,
      bookmarked: false,
      coverNote: coverNote || '',
      appliedAt: new Date(),
    },
    { upsert: true, new: true }
  )
}

async function myApplications(userId) {
  return JobApplication.find({ student: userId })
    .populate('job')
    .sort({ updatedAt: -1 })
    .lean()
}

async function listAlumni(filters = {}) {
  const q = { visible: true }
  if (filters.q) {
    q.$or = [
      { currentRole: new RegExp(filters.q, 'i') },
      { company: new RegExp(filters.q, 'i') },
      { successStory: new RegExp(filters.q, 'i') },
    ]
  }
  if (filters.mentors === 'true') q.openToMentorship = true
  return AlumniProfile.find(q)
    .populate('user', 'fullName email profileImage')
    .populate('course', 'title')
    .sort({ graduationYear: -1 })
    .lean()
}

async function upsertAlumni(userId, payload) {
  return AlumniProfile.findOneAndUpdate(
    { user: userId },
    { ...payload, user: userId },
    { upsert: true, new: true }
  )
}

async function listAlumniEvents() {
  return AlumniEvent.find().sort({ startsAt: -1 }).lean()
}

async function createAlumniEvent(payload, userId) {
  const event = await AlumniEvent.create({ ...payload, createdBy: userId })
  const alumni = await AlumniProfile.find({ visible: true }).select('user').limit(50).lean()
  await Promise.all(
    alumni.map((a) =>
      notificationService.notifyUser({
        userId: a.user,
        templateKey: COMM_NOTIFY.ALUMNI_MEETUP,
        title: 'Alumni event',
        body: event.title,
        link: '/alumni',
        meta: { eventId: event._id },
      })
    )
  )
  return event
}

async function globalSearch({ q, type } = {}) {
  if (!q) return { students: [], jobs: [], alumni: [], tickets: [], discussions: [] }
  const User = require('../models/User')
  const Discussion = require('../models/Discussion')
  const { Ticket } = require('../models/Communication')
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  const [students, jobs, alumni, tickets, discussions] = await Promise.all([
    !type || type === 'students'
      ? User.find({ role: ROLES.STUDENT, $or: [{ fullName: re }, { email: re }] })
          .select('fullName email')
          .limit(10)
          .lean()
      : [],
    !type || type === 'jobs'
      ? JobPosting.find({ status: 'published', $or: [{ title: re }, { company: re }] })
          .limit(10)
          .lean()
      : [],
    !type || type === 'alumni'
      ? AlumniProfile.find({ visible: true, $or: [{ company: re }, { currentRole: re }] })
          .populate('user', 'fullName')
          .limit(10)
          .lean()
      : [],
    !type || type === 'tickets'
      ? Ticket.find({ $or: [{ subject: re }, { ticketNumber: re }] })
          .limit(10)
          .lean()
      : [],
    !type || type === 'discussions'
      ? Discussion.find({ parent: null, deletedAt: null, $or: [{ title: re }, { body: re }] })
          .limit(10)
          .lean()
      : [],
  ])
  return { students, jobs, alumni, tickets, discussions }
}

module.exports = {
  getMyCareer,
  updateCareer,
  reviewCareer,
  listCareers,
  listJobs,
  getJob,
  createJob,
  updateJob,
  applyToJob,
  myApplications,
  listAlumni,
  upsertAlumni,
  listAlumniEvents,
  createAlumniEvent,
  globalSearch,
}
