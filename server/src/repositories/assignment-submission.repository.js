const AssignmentSubmission = require('../models/AssignmentSubmission')

async function create(data) {
  return AssignmentSubmission.create(data)
}

async function findById(id) {
  return AssignmentSubmission.findById(id)
    .populate('student', 'fullName email')
    .populate('assignment')
    .populate('reviewedBy', 'fullName email')
}

async function findLatest(studentId, assignmentId) {
  return AssignmentSubmission.findOne({ student: studentId, assignment: assignmentId })
    .sort({ attemptNumber: -1 })
}

async function listForAssignment(assignmentId, { status, page = 1, limit = 20 } = {}) {
  const filter = { assignment: assignmentId }
  if (status) filter.status = status
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    AssignmentSubmission.find(filter)
      .sort({ submittedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('student', 'fullName email')
      .lean(),
    AssignmentSubmission.countDocuments(filter),
  ])
  return { items, total, page, limit }
}

async function listForStudent(studentId, { courseId, status } = {}) {
  const filter = { student: studentId }
  if (courseId) filter.course = courseId
  if (status) filter.status = status
  return AssignmentSubmission.find(filter)
    .sort({ updatedAt: -1 })
    .populate('assignment', 'title dueAt maxMarks type status')
    .populate('course', 'title slug')
    .lean()
}

async function history(studentId, assignmentId) {
  return AssignmentSubmission.find({ student: studentId, assignment: assignmentId })
    .sort({ attemptNumber: -1 })
    .lean()
}

async function update(id, data) {
  return AssignmentSubmission.findByIdAndUpdate(id, data, { new: true, runValidators: true })
}

module.exports = {
  create,
  findById,
  findLatest,
  listForAssignment,
  listForStudent,
  history,
  update,
  Model: AssignmentSubmission,
}
