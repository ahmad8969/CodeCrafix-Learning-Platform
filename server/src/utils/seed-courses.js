require('dotenv').config()
const connectDB = require('../config/db')
const Category = require('../models/Category')
const Course = require('../models/Course')
const Batch = require('../models/Batch')
const User = require('../models/User')
const { ROLES } = require('../constants')
const { slugify } = require('../utils/query')

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Programming',
  'Graphic Designing',
  'Digital Marketing',
  'E-Commerce',
  'Spoken English',
  'Office Productivity',
  'Artificial Intelligence',
  'YouTube Automation',
]

async function seedCourses() {
  await connectDB()

  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const teacher = await User.findOne({ role: ROLES.TEACHER })
  if (!admin || !teacher) {
    throw new Error('Run npm run seed first to create demo users')
  }

  const categoryDocs = []
  for (let i = 0; i < CATEGORIES.length; i += 1) {
    const name = CATEGORIES[i]
    const slug = slugify(name)
    let cat = await Category.findOne({ slug })
    if (!cat) {
      cat = await Category.create({
        name,
        slug,
        description: `${name} courses on CodeCrafters`,
        displayOrder: i + 1,
        color: ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b'][i % 5],
        createdBy: admin._id,
        updatedBy: admin._id,
      })
      console.log('Category:', name)
    }
    categoryDocs.push(cat)
  }

  const web = categoryDocs[0]
  let course = await Course.findOne({ slug: 'full-stack-web-bootcamp' })
  if (!course) {
    course = await Course.create({
      title: 'Full Stack Web Bootcamp',
      slug: 'full-stack-web-bootcamp',
      shortDescription: 'Build modern web apps with React and Node.',
      fullDescription: 'A comprehensive path covering frontend, backend, and deployment.',
      category: web._id,
      instructor: teacher._id,
      difficulty: 'beginner',
      duration: '3 Months',
      estimatedHours: 120,
      price: 499,
      discountPrice: 399,
      currency: 'USD',
      status: 'published',
      featured: true,
      trending: true,
      tags: ['react', 'node', 'mongodb'],
      learningOutcomes: ['Build SPA apps', 'Design REST APIs', 'Deploy to production'],
      requirements: ['Basic computer literacy'],
      targetAudience: ['Beginners', 'Career switchers'],
      publishedAt: new Date(),
      createdBy: admin._id,
      updatedBy: admin._id,
      settings: {
        enableCertificate: true,
        enablePractice: true,
        enableAssignment: true,
        enableQuiz: true,
      },
    })
    console.log('Course:', course.title)
  }

  const existingBatch = await Batch.findOne({ course: course._id, batchCode: 'FSW-A1' })
  if (!existingBatch) {
    await Batch.create({
      course: course._id,
      name: 'Weekend Batch A1',
      batchCode: 'FSW-A1',
      startDate: new Date(Date.now() + 7 * 86400000),
      endDate: new Date(Date.now() + 100 * 86400000),
      days: ['friday', 'saturday', 'sunday'],
      classTime: '06:00 PM',
      durationPerClass: '2 Hours',
      maximumStudents: 25,
      teacher: teacher._id,
      status: 'upcoming',
      createdBy: admin._id,
      updatedBy: admin._id,
    })
    console.log('Batch: FSW-A1')
  }

  console.log('Course seed complete')
  process.exit(0)
}

seedCourses().catch((err) => {
  console.error(err)
  process.exit(1)
})
