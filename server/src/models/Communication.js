const mongoose = require('mongoose')
const {
  CHAT_TYPES,
  TICKET_CATEGORIES,
  TICKET_STATUS,
  TICKET_PRIORITY,
  CRM_STAGES,
  SURVEY_TYPES,
  SURVEY_QUESTION_TYPES,
  JOB_TYPES,
  APPLICATION_STATUS,
  FREELANCE_PLATFORMS,
} = require('../constants/communication')

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    mimeType: String,
    size: Number,
  },
  { _id: false }
)

/** —— Messaging —— */
const conversationSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    type: { type: String, enum: Object.values(CHAT_TYPES), default: CHAT_TYPES.DIRECT },
    title: { type: String, default: '' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '' },
    pinnedMessageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' }],
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    typingPlaceholder: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
)

conversationSchema.index({ participants: 1, lastMessageAt: -1 })

const chatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, default: '', maxlength: 10000 },
    attachments: [attachmentSchema],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactionsPlaceholder: [{ emoji: String, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
    pinned: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

chatMessageSchema.index({ conversation: 1, createdAt: -1 })
chatMessageSchema.index({ body: 'text' })

/** —— Helpdesk —— */
const ticketSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    ticketNumber: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    category: {
      type: String,
      enum: Object.values(TICKET_CATEGORIES),
      default: TICKET_CATEGORIES.GENERAL,
    },
    subject: { type: String, required: true, maxlength: 300 },
    description: { type: String, default: '', maxlength: 10000 },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITY),
      default: TICKET_PRIORITY.MEDIUM,
    },
    attachments: [attachmentSchema],
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    slaPlaceholder: {
      responseDueAt: { type: Date, default: null },
      resolveDueAt: { type: Date, default: null },
    },
    timeline: [
      {
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String },
        note: { type: String, default: '' },
        internal: { type: Boolean, default: false },
        attachments: [attachmentSchema],
      },
    ],
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

ticketSchema.index({ institute: 1, status: 1, updatedAt: -1 })
ticketSchema.index({ institute: 1, priority: 1, createdAt: -1 })

/** —— CRM —— */
const crmLeadSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    fullName: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    source: { type: String, default: '' },
    counselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    stage: {
      type: String,
      enum: Object.values(CRM_STAGES),
      default: CRM_STAGES.LEAD,
      index: true,
    },
    interestedCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    conversionStatus: { type: String, default: 'open' },
    notes: { type: String, default: '' },
    followUps: [
      {
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        nextFollowUpAt: Date,
      },
    ],
    parentContact: {
      name: String,
      phone: String,
      email: String,
      relation: String,
    },
  },
  { timestamps: true }
)

crmLeadSchema.index({ stage: 1, updatedAt: -1 })

/** —— Surveys —— */
const surveySchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    title: { type: String, required: true },
    type: { type: String, enum: Object.values(SURVEY_TYPES), default: SURVEY_TYPES.COURSE },
    description: { type: String, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    questions: [
      {
        key: String,
        prompt: String,
        type: { type: String, enum: Object.values(SURVEY_QUESTION_TYPES) },
        options: [String],
        required: { type: Boolean, default: true },
      },
    ],
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
    publishedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

const surveyResponseSchema = new mongoose.Schema(
  {
    survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true, index: true },
    respondent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [
      {
        questionKey: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
)

surveyResponseSchema.index({ survey: 1, respondent: 1 }, { unique: true })

/** —— Career / Portfolio —— */
const careerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: [{ type: String }],
    experience: [
      {
        title: String,
        company: String,
        from: String,
        to: String,
        description: String,
      },
    ],
    education: [
      {
        school: String,
        degree: String,
        year: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        year: String,
        verified: { type: Boolean, default: false },
      },
    ],
    socialLinks: {
      linkedin: String,
      github: String,
      portfolio: String,
      other: String,
    },
    resumeUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'rejected'],
      default: 'draft',
    },
    recommendedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    verifiedSkills: [{ type: String }],
    freelanceHub: {
      platforms: [
        {
          platform: { type: String, enum: Object.values(FREELANCE_PLATFORMS) },
          profileUrl: String,
          profileCompletion: { type: Number, default: 0 },
        },
      ],
      proposalPracticeCount: { type: Number, default: 0 },
      interviewPrepDone: { type: Boolean, default: false },
      portfolioReady: { type: Boolean, default: false },
      clientCommExercises: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

const jobPostingSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    title: { type: String, required: true },
    company: { type: String, required: true },
    type: { type: String, enum: Object.values(JOB_TYPES), default: JOB_TYPES.FULL_TIME },
    location: { type: String, default: '' },
    skillsRequired: [{ type: String }],
    experience: { type: String, default: '' },
    salaryPlaceholder: { type: String, default: '' },
    description: { type: String, default: '' },
    deadline: { type: Date, default: null },
    applyLink: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'published' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

const jobApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.APPLIED,
    },
    bookmarked: { type: Boolean, default: false },
    coverNote: { type: String, default: '' },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

jobApplicationSchema.index({ job: 1, student: 1 }, { unique: true })

/** —— Alumni —— */
const alumniProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    graduationYear: { type: String, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    currentRole: { type: String, default: '' },
    company: { type: String, default: '' },
    successStory: { type: String, default: '' },
    openToMentorship: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    socialLinks: {
      linkedin: String,
      website: String,
    },
  },
  { timestamps: true }
)

const alumniEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startsAt: { type: Date, default: null },
    location: { type: String, default: '' },
    isMeetup: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

module.exports = {
  Conversation: mongoose.model('Conversation', conversationSchema),
  ChatMessage: mongoose.model('ChatMessage', chatMessageSchema),
  Ticket: mongoose.model('Ticket', ticketSchema),
  CrmLead: mongoose.model('CrmLead', crmLeadSchema),
  Survey: mongoose.model('Survey', surveySchema),
  SurveyResponse: mongoose.model('SurveyResponse', surveyResponseSchema),
  CareerProfile: mongoose.model('CareerProfile', careerProfileSchema),
  JobPosting: mongoose.model('JobPosting', jobPostingSchema),
  JobApplication: mongoose.model('JobApplication', jobApplicationSchema),
  AlumniProfile: mongoose.model('AlumniProfile', alumniProfileSchema),
  AlumniEvent: mongoose.model('AlumniEvent', alumniEventSchema),
}
