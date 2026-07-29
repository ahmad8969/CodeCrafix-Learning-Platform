import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

export const courseBasicSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  slug: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  fullDescription: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  instructor: z.string().min(1, 'Instructor is required'),
  language: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
})

export const courseMediaSchema = z.object({
  thumbnail: z.string().url().optional().or(z.literal('')),
  coverImage: z.string().url().optional().or(z.literal('')),
  promoVideoUrl: z.string().url().optional().or(z.literal('')),
  introVideoUrl: z.string().url().optional().or(z.literal('')),
})

export const coursePricingSchema = z.object({
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).nullable().optional(),
  currency: z.string().min(1),
  enrollmentLimit: z.coerce.number().min(0).nullable().optional(),
  minimumAge: z.coerce.number().min(0).nullable().optional(),
  certificateAvailable: z.boolean().optional(),
  downloadableResources: z.boolean().optional(),
})

export const courseSettingsSchema = z.object({
  enableCertificate: z.boolean(),
  enablePractice: z.boolean(),
  enableAssignment: z.boolean(),
  enableQuiz: z.boolean(),
  enableDiscussion: z.boolean(),
  enableDownloads: z.boolean(),
  enableNotes: z.boolean(),
  enableLiveClasses: z.boolean(),
  enableAiAssistant: z.boolean(),
  enableAnnouncements: z.boolean(),
  enableProgressTracking: z.boolean(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  popular: z.boolean().optional(),
  visibility: z.enum(['public', 'private', 'password_protected']).optional(),
})

export const courseSeoSchema = z.object({
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
})

export const batchSchema = z.object({
  course: z.string().min(1, 'Course is required'),
  name: z.string().min(2, 'Batch name is required'),
  batchCode: z.string().min(2, 'Batch code is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  days: z.array(z.enum(['friday', 'saturday', 'sunday'])).min(1),
  classTime: z.string().optional(),
  durationPerClass: z.string().optional(),
  maximumStudents: z.coerce.number().min(1),
  teacher: z.string().min(1, 'Teacher is required'),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']),
})
