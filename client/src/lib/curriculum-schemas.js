import { z } from 'zod'

export const LESSON_TYPES = [
  'text',
  'markdown',
  'video',
  'code_example',
  'image_gallery',
  'external_link',
  'pdf',
  'download',
  'article',
]

export const RESOURCE_TYPES = [
  'pdf',
  'zip',
  'github',
  'documentation',
  'website',
  'source_code',
  'cheat_sheet',
  'downloadable',
  'external_video',
]

export const moduleSchema = z.object({
  course: z.string().min(1),
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  estimatedDuration: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

export const weekSchema = z.object({
  module: z.string().min(1),
  weekNumber: z.coerce.number().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

export const topicSchema = z.object({
  week: z.string().min(1),
  name: z.string().min(2),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedTime: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  learningObjectives: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

export const lessonSchema = z.object({
  topic: z.string().min(1),
  title: z.string().min(2),
  lessonType: z.enum(LESSON_TYPES).optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  estimatedReadingTime: z.coerce.number().min(0).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  previewAllowed: z.boolean().optional(),
  bookmarksEnabled: z.boolean().optional(),
})

export const resourceSchema = z.object({
  lesson: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(RESOURCE_TYPES).optional(),
  url: z.string().url('Valid URL required'),
  size: z.string().optional(),
  visibility: z.enum(['public', 'enrolled', 'preview']).optional(),
})
