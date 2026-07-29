import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonLoader } from '@/components/loaders'
import {
  courseBasicSchema,
  courseMediaSchema,
  coursePricingSchema,
  courseSettingsSchema,
  courseSeoSchema,
} from '@/lib/course-schemas'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'basic', title: 'Basic Information', schema: courseBasicSchema },
  { id: 'media', title: 'Media', schema: courseMediaSchema },
  { id: 'pricing', title: 'Pricing', schema: coursePricingSchema },
  { id: 'settings', title: 'Settings', schema: courseSettingsSchema },
  { id: 'seo', title: 'SEO', schema: courseSeoSchema },
]

const defaultValues = {
  title: '',
  slug: '',
  shortDescription: '',
  fullDescription: '',
  category: '',
  instructor: '',
  language: 'English',
  difficulty: 'beginner',
  duration: '3 Months',
  estimatedHours: 40,
  tags: [],
  learningOutcomes: [],
  requirements: [],
  targetAudience: [],
  thumbnail: '',
  coverImage: '',
  promoVideoUrl: '',
  introVideoUrl: '',
  price: 0,
  discountPrice: null,
  currency: 'USD',
  enrollmentLimit: null,
  minimumAge: null,
  certificateAvailable: true,
  downloadableResources: true,
  enableCertificate: true,
  enablePractice: true,
  enableAssignment: true,
  enableQuiz: true,
  enableDiscussion: true,
  enableDownloads: true,
  enableNotes: true,
  enableLiveClasses: false,
  enableAiAssistant: false,
  enableAnnouncements: true,
  enableProgressTracking: true,
  status: 'draft',
  featured: false,
  trending: false,
  popular: false,
  visibility: 'public',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
}

function listToText(arr) {
  return Array.isArray(arr) ? arr.join('\n') : ''
}

function textToList(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function CourseMultiStepForm({
  initialData,
  categories = [],
  instructors = [],
  onSubmit,
  onAutoSave,
  submitting = false,
}) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  const mergedDefaults = useMemo(() => {
    if (!initialData) return defaultValues
    return {
      ...defaultValues,
      ...initialData,
      category: initialData.category?._id || initialData.category || '',
      instructor: initialData.instructor?._id || initialData.instructor || '',
      tags: initialData.tags || [],
      learningOutcomes: initialData.learningOutcomes || [],
      requirements: initialData.requirements || [],
      targetAudience: initialData.targetAudience || [],
      seoKeywords: initialData.seoKeywords || [],
      ...(initialData.settings || {}),
      thumbnail: initialData.thumbnail || '',
      coverImage: initialData.coverImage || '',
      promoVideoUrl: initialData.promoVideoUrl || '',
      introVideoUrl: initialData.introVideoUrl || '',
    }
  }, [initialData])

  const form = useForm({
    resolver: zodResolver(current.schema),
    defaultValues: mergedDefaults,
    values: mergedDefaults,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = form

  // Auto-save draft every 20s when a title exists
  useEffect(() => {
    if (!onAutoSave) return undefined
    const id = setInterval(() => {
      const values = getValues()
      if (!values.title || String(values.title).trim().length < 3) return
      onAutoSave(buildPayload(values))
    }, 20000)
    return () => clearInterval(id)
  }, [getValues, onAutoSave])

  const next = async () => {
    const ok = await trigger()
    if (!ok) return
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else handleSubmit((values) => onSubmit(buildPayload({ ...getValues(), ...values })))()
  }

  const back = () => setStep((s) => Math.max(0, s - 1))

  const values = watch()

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')}
          />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Step {step + 1}: {current.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <Field label="Title" error={errors.title?.message}>
                <Input {...register('title')} />
              </Field>
              <Field label="Slug (optional)">
                <Input {...register('slug')} placeholder="auto-generated from title" />
              </Field>
              <Field label="Short description" error={errors.shortDescription?.message}>
                <Input {...register('shortDescription')} />
              </Field>
              <Field label="Full description">
                <textarea
                  className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  {...register('fullDescription')}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" error={errors.category?.message}>
                  <Select value={values.category} onValueChange={(v) => setValue('category', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Instructor" error={errors.instructor?.message}>
                  <Select value={values.instructor} onValueChange={(v) => setValue('instructor', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((u) => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Difficulty">
                  <Select value={values.difficulty} onValueChange={(v) => setValue('difficulty', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Duration">
                  <Select value={values.duration} onValueChange={(v) => setValue('duration', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2 Months">2 Months</SelectItem>
                      <SelectItem value="3 Months">3 Months</SelectItem>
                      <SelectItem value="6 Months">6 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Language">
                  <Input {...register('language')} />
                </Field>
                <Field label="Estimated hours">
                  <Input type="number" {...register('estimatedHours')} />
                </Field>
              </div>
              <Field label="Tags (one per line)">
                <textarea
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={listToText(values.tags)}
                  onBlur={(e) => setValue('tags', textToList(e.target.value))}
                />
              </Field>
              <Field label="Learning outcomes (one per line)">
                <textarea
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={listToText(values.learningOutcomes)}
                  onBlur={(e) => setValue('learningOutcomes', textToList(e.target.value))}
                />
              </Field>
              <Field label="Requirements (one per line)">
                <textarea
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={listToText(values.requirements)}
                  onBlur={(e) => setValue('requirements', textToList(e.target.value))}
                />
              </Field>
              <Field label="Target audience (one per line)">
                <textarea
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={listToText(values.targetAudience)}
                  onBlur={(e) => setValue('targetAudience', textToList(e.target.value))}
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Thumbnail URL" error={errors.thumbnail?.message}>
                <Input {...register('thumbnail')} placeholder="https://" />
              </Field>
              <Field label="Cover image URL" error={errors.coverImage?.message}>
                <Input {...register('coverImage')} placeholder="https://" />
              </Field>
              <Field label="Promo video URL" error={errors.promoVideoUrl?.message}>
                <Input {...register('promoVideoUrl')} placeholder="https://" />
              </Field>
              <Field label="Intro video URL" error={errors.introVideoUrl?.message}>
                <Input {...register('introVideoUrl')} placeholder="https://" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price" error={errors.price?.message}>
                <Input type="number" step="0.01" {...register('price')} />
              </Field>
              <Field label="Discount price">
                <Input type="number" step="0.01" {...register('discountPrice')} />
              </Field>
              <Field label="Currency">
                <Input {...register('currency')} />
              </Field>
              <Field label="Enrollment limit">
                <Input type="number" {...register('enrollmentLimit')} />
              </Field>
              <Field label="Minimum age">
                <Input type="number" {...register('minimumAge')} />
              </Field>
              <BoolField
                label="Certificate available"
                checked={values.certificateAvailable}
                onChange={(v) => setValue('certificateAvailable', v)}
              />
              <BoolField
                label="Downloadable resources"
                checked={values.downloadableResources}
                onChange={(v) => setValue('downloadableResources', v)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'enableCertificate',
                'enablePractice',
                'enableAssignment',
                'enableQuiz',
                'enableDiscussion',
                'enableDownloads',
                'enableNotes',
                'enableLiveClasses',
                'enableAiAssistant',
                'enableAnnouncements',
                'enableProgressTracking',
                'featured',
                'trending',
                'popular',
              ].map((key) => (
                <BoolField
                  key={key}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                  checked={Boolean(values[key])}
                  onChange={(v) => setValue(key, v)}
                />
              ))}
              <Field label="Status">
                <Select value={values.status} onValueChange={(v) => setValue('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Visibility">
                <Select value={values.visibility} onValueChange={(v) => setValue('visibility', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="password_protected">Password Protected</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {step === 4 && (
            <>
              <Field label="SEO title">
                <Input {...register('seoTitle')} />
              </Field>
              <Field label="SEO description">
                <textarea
                  className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  {...register('seoDescription')}
                />
              </Field>
              <Field label="SEO keywords (one per line)">
                <textarea
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={listToText(values.seoKeywords)}
                  onBlur={(e) => setValue('seoKeywords', textToList(e.target.value))}
                />
              </Field>
            </>
          )}

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            <div className="flex gap-2">
              {onAutoSave && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onAutoSave(buildPayload(getValues()))}
                >
                  Save draft
                </Button>
              )}
              <Button type="button" onClick={next} disabled={submitting}>
                {submitting && <ButtonLoader />}
                {step === STEPS.length - 1 ? 'Save course' : 'Continue'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function buildPayload(values) {
  const emptyToNull = (v) => (v === '' || v === undefined ? null : v)
  return {
    title: values.title,
    slug: values.slug || undefined,
    shortDescription: values.shortDescription,
    fullDescription: values.fullDescription,
    category: values.category,
    instructor: values.instructor,
    language: values.language,
    difficulty: values.difficulty,
    duration: values.duration,
    estimatedHours: Number(values.estimatedHours) || 0,
    tags: values.tags || [],
    learningOutcomes: values.learningOutcomes || [],
    requirements: values.requirements || [],
    targetAudience: values.targetAudience || [],
    thumbnail: emptyToNull(values.thumbnail),
    coverImage: emptyToNull(values.coverImage),
    promoVideoUrl: emptyToNull(values.promoVideoUrl),
    introVideoUrl: emptyToNull(values.introVideoUrl),
    price: Number(values.price) || 0,
    discountPrice:
      values.discountPrice === '' || values.discountPrice == null
        ? null
        : Number(values.discountPrice),
    currency: values.currency || 'USD',
    enrollmentLimit:
      values.enrollmentLimit === '' || values.enrollmentLimit == null
        ? null
        : Number(values.enrollmentLimit),
    minimumAge:
      values.minimumAge === '' || values.minimumAge == null ? null : Number(values.minimumAge),
    certificateAvailable: Boolean(values.certificateAvailable),
    downloadableResources: Boolean(values.downloadableResources),
    status: values.status || 'draft',
    featured: Boolean(values.featured),
    trending: Boolean(values.trending),
    popular: Boolean(values.popular),
    visibility: values.visibility || 'public',
    seoTitle: values.seoTitle,
    seoDescription: values.seoDescription,
    seoKeywords: values.seoKeywords || [],
    settings: {
      enableCertificate: Boolean(values.enableCertificate),
      enablePractice: Boolean(values.enablePractice),
      enableAssignment: Boolean(values.enableAssignment),
      enableQuiz: Boolean(values.enableQuiz),
      enableDiscussion: Boolean(values.enableDiscussion),
      enableDownloads: Boolean(values.enableDownloads),
      enableNotes: Boolean(values.enableNotes),
      enableLiveClasses: Boolean(values.enableLiveClasses),
      enableAiAssistant: Boolean(values.enableAiAssistant),
      enableAnnouncements: Boolean(values.enableAnnouncements),
      enableProgressTracking: Boolean(values.enableProgressTracking),
    },
  }
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function BoolField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      {label}
    </label>
  )
}
