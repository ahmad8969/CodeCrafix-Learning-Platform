const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { ApiError } = require('../utils/helpers')
const { DEFAULT_UPLOAD_CONFIG } = require('../constants/assignment')

const uploadRoot = path.join(__dirname, '../../uploads/assignments')

function ensureUploadDir() {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true })
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir()
    cb(null, uploadRoot)
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}-${safe}`)
  },
})

function createAssignmentUpload({ maxFiles, maxFileSizeMb, allowedMimeTypes, allowedExtensions } = {}) {
  const maxMb = maxFileSizeMb || DEFAULT_UPLOAD_CONFIG.maxFileSizeMb
  const mimes = allowedMimeTypes || DEFAULT_UPLOAD_CONFIG.allowedMimeTypes
  const exts = (allowedExtensions || DEFAULT_UPLOAD_CONFIG.allowedExtensions).map((e) =>
    e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`
  )

  return multer({
    storage,
    limits: {
      fileSize: maxMb * 1024 * 1024,
      files: maxFiles || DEFAULT_UPLOAD_CONFIG.maxFiles,
    },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      if (exts.length && !exts.includes(ext)) {
        return cb(new ApiError(400, `File type ${ext} is not allowed`))
      }
      if (mimes.length && file.mimetype && !mimes.includes(file.mimetype)) {
        // allow if extension is ok (browsers sometimes send odd mimes)
        if (!exts.includes(ext)) {
          return cb(new ApiError(400, `MIME type ${file.mimetype} is not allowed`))
        }
      }
      // Virus scan placeholder — always skip for now
      cb(null, true)
    },
  })
}

function mapUploadedFiles(req) {
  const files = req.files || (req.file ? [req.file] : [])
  return files.map((f) => ({
    originalName: f.originalname,
    filename: f.filename,
    url: `/uploads/assignments/${f.filename}`,
    mimeType: f.mimetype,
    size: f.size,
  }))
}

module.exports = {
  createAssignmentUpload,
  mapUploadedFiles,
  uploadRoot,
  ensureUploadDir,
}
