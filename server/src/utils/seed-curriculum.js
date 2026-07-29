require('dotenv').config()
const connectDB = require('../config/db')
const Course = require('../models/Course')
const Module = require('../models/Module')
const Week = require('../models/Week')
const Topic = require('../models/Topic')
const Lesson = require('../models/Lesson')
const Resource = require('../models/Resource')
const User = require('../models/User')
const { ROLES } = require('../constants')

async function seedCurriculum() {
  await connectDB()

  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const course = await Course.findOne({ slug: 'full-stack-web-bootcamp', deletedAt: null })
  if (!admin || !course) {
    throw new Error('Run seed and seed:courses first')
  }

  let mod = await Module.findOne({ course: course._id, slug: 'foundations' })
  if (!mod) {
    mod = await Module.create({
      course: course._id,
      name: 'Foundations',
      slug: 'foundations',
      description: 'Core web development foundations',
      displayOrder: 0,
      estimatedDuration: '4 weeks',
      status: 'published',
      createdBy: admin._id,
      updatedBy: admin._id,
    })
    console.log('Module: Foundations')
  }

  let week = await Week.findOne({ module: mod._id, weekNumber: 1, deletedAt: null })
  if (!week) {
    week = await Week.create({
      course: course._id,
      module: mod._id,
      weekNumber: 1,
      name: 'Week 1 — HTML & CSS',
      description: 'Structure and style the web',
      displayOrder: 0,
      estimatedHours: 8,
      status: 'published',
      createdBy: admin._id,
      updatedBy: admin._id,
    })
    console.log('Week: Week 1')
  }

  let topic = await Topic.findOne({ week: week._id, slug: 'semantic-html' })
  if (!topic) {
    topic = await Topic.create({
      course: course._id,
      module: mod._id,
      week: week._id,
      name: 'Semantic HTML',
      slug: 'semantic-html',
      shortDescription: 'Build accessible document structure',
      difficulty: 'beginner',
      estimatedTime: '90 min',
      displayOrder: 0,
      status: 'published',
      learningObjectives: ['Use semantic tags', 'Structure pages correctly'],
      keywords: ['html', 'semantics'],
      tags: ['html', 'frontend'],
      createdBy: admin._id,
      updatedBy: admin._id,
    })
    console.log('Topic: Semantic HTML')
  }

  let lesson = await Lesson.findOne({ topic: topic._id, title: 'Introduction to Semantic HTML' })
  const richContent = `## Introduction

Semantic HTML gives meaning to structure so browsers, assistive tech, and search engines understand your page.

## Learning Objectives

- Explain why semantic tags matter
- Choose the right landmark elements
- Build an accessible page outline

## Theory

Semantic elements describe **purpose**, not appearance. Prefer \`header\`, \`nav\`, \`main\`, \`article\`, and \`footer\` over anonymous \`div\` wrappers.

The accessibility tree benefits when headings follow a clear order: one \`h1\`, then \`h2\` sections.

Inline math example for density formulas used in layouts: $w = \\frac{c}{n}$.

## Explanation

When you wrap navigation in \`nav\`, screen readers can jump directly to it. When you wrap primary content in \`main\`, skip links become reliable.

> tip: Start every page with a single clear h1 that matches the page purpose.

## Examples

\`\`\`html
<header>
  <nav aria-label="Primary">...</nav>
</header>
<main>
  <article>
    <h1>Semantic HTML</h1>
    <p>Content that stands alone.</p>
  </article>
</main>
<footer>...</footer>
\`\`\`

## Common Mistakes

- Using multiple \`h1\` tags for style
- Nesting interactive elements incorrectly
- Skipping heading levels for visual design

> warning: Div soup hides structure from assistive technologies.

## Best Practices

1. One \`h1\` per page
2. Landmarks for navigation and main content
3. Meaningful \`alt\` text for images
4. Labels for every form control

## Real World Usage

Marketing sites, documentation portals, and dashboards all benefit from semantic landmarks — especially for keyboard-only users.

## Summary

Semantic HTML is the foundation of accessible, maintainable frontends.

## Key Takeaways

- Meaning over presentation
- Landmarks unlock navigation
- Headings create a content map

## Resources

- MDN HTML element reference
- WAI-ARIA landmarks

## What's Next

Practice building a page outline, then move on to forms and accessible inputs.
`

  if (!lesson) {
    lesson = await Lesson.create({
      course: course._id,
      module: mod._id,
      week: week._id,
      topic: topic._id,
      title: 'Introduction to Semantic HTML',
      lessonType: 'markdown',
      content: richContent,
      summary: 'Learn why semantic tags improve accessibility and SEO.',
      estimatedReadingTime: 12,
      displayOrder: 0,
      status: 'published',
      previewAllowed: true,
      createdBy: admin._id,
      updatedBy: admin._id,
    })
    console.log('Lesson: Introduction to Semantic HTML')
  } else {
    lesson.content = richContent
    lesson.status = 'published'
    lesson.previewAllowed = true
    await lesson.save()
    console.log('Lesson updated: Introduction to Semantic HTML')
  }

  const existingRes = await Resource.findOne({ lesson: lesson._id, title: 'MDN HTML Elements' })
  if (!existingRes) {
    await Resource.create({
      course: course._id,
      lesson: lesson._id,
      topic: topic._id,
      title: 'MDN HTML Elements',
      description: 'Official HTML element reference',
      type: 'documentation',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element',
      visibility: 'preview',
      displayOrder: 0,
      createdBy: admin._id,
      updatedBy: admin._id,
    })
    console.log('Resource: MDN HTML Elements')
  }

  // Second lesson draft
  const lesson2 = await Lesson.findOne({ topic: topic._id, title: 'Forms & Inputs' })
  if (!lesson2) {
    await Lesson.create({
      course: course._id,
      module: mod._id,
      week: week._id,
      topic: topic._id,
      title: 'Forms & Inputs',
      lessonType: 'markdown',
      content: `# Forms & Inputs\n\nBuild accessible forms with labels and validation hints.`,
      summary: 'Form basics for beginners.',
      estimatedReadingTime: 15,
      displayOrder: 1,
      status: 'draft',
      createdBy: admin._id,
      updatedBy: admin._id,
    })
    console.log('Lesson: Forms & Inputs (draft)')
  }

  console.log('Curriculum seed complete for', course.title)
  process.exit(0)
}

seedCurriculum().catch((err) => {
  console.error(err)
  process.exit(1)
})
