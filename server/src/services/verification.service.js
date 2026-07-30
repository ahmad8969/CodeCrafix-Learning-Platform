const { Certificate } = require('../models/Certificate')
const { CERTIFICATE_STATUS } = require('../constants/certificate')
const { ApiError } = require('../utils/helpers')

/**
 * Public certificate verification — no auth required.
 */
async function verifyByToken(token) {
  if (!token) throw new ApiError(400, 'Verification token required')
  const cert = await Certificate.findOne({ verificationToken: token })
    .populate('user', 'fullName')
    .populate('course', 'title slug')
    .populate('template', 'name logoUrl primaryColor accentColor titleText')
    .lean()

  if (!cert) {
    return {
      valid: false,
      status: 'not_found',
      message: 'No certificate found for this verification code.',
    }
  }

  if (cert.status === CERTIFICATE_STATUS.REVOKED) {
    return {
      valid: false,
      status: 'revoked',
      message: 'This certificate has been revoked.',
      certificateNumber: cert.certificateNumber,
      studentName: cert.studentName,
      courseName: cert.courseName,
      revokedAt: cert.revokedAt,
    }
  }

  if (cert.status !== CERTIFICATE_STATUS.ISSUED) {
    return {
      valid: false,
      status: cert.status,
      message: 'This certificate is not yet issued.',
      certificateNumber: cert.certificateNumber,
    }
  }

  return {
    valid: true,
    status: 'issued',
    message: 'Certificate verified successfully.',
    certificateNumber: cert.certificateNumber,
    studentName: cert.studentName,
    courseName: cert.courseName,
    instructorName: cert.instructorName,
    completionDate: cert.completionDate,
    issuedAt: cert.issuedAt,
    type: cert.type,
    title: cert.title,
    verificationUrl: cert.verificationUrl,
    qrPayload: cert.qrPayload,
    snapshot: cert.snapshot,
    course: cert.course,
  }
}

async function verifyByNumber(certificateNumber) {
  if (!certificateNumber) throw new ApiError(400, 'Certificate number required')
  const cert = await Certificate.findOne({
    certificateNumber: String(certificateNumber).trim().toUpperCase(),
  }).select('verificationToken')
  if (!cert) {
    return { valid: false, status: 'not_found', message: 'Certificate not found.' }
  }
  return verifyByToken(cert.verificationToken)
}

module.exports = {
  verifyByToken,
  verifyByNumber,
}
