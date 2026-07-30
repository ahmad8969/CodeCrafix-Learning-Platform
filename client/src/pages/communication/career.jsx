import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/loaders'
import { communicationService } from '@/services/communication.service'
import {
  JobCard,
  PortfolioCard,
  SurveyForm,
} from '@/components/communication/comm-widgets'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

function basePath(role) {
  if (role === 'student') return ROUTES.STUDENT
  if (role === 'teacher') return ROUTES.TEACHER
  if (role === 'super_admin') return ROUTES.SUPER_ADMIN
  return ROUTES.ADMIN
}

export default function CareerPortalPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['career-me'],
    queryFn: () => communicationService.myCareer(),
  })
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => communicationService.listJobs(),
  })
  const { data: apps } = useQuery({
    queryKey: ['my-apps'],
    queryFn: () => communicationService.myApplications(),
  })

  const save = useMutation({
    mutationFn: (payload) => communicationService.updateCareer(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['career-me'] }),
  })
  const apply = useMutation({
    mutationFn: (id) => communicationService.applyJob(id, { coverNote: 'Interested' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-apps'] }),
  })
  const bookmark = useMutation({
    mutationFn: (id) => communicationService.applyJob(id, { bookmarkOnly: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-apps'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Career portal</h1>
          <p className="text-sm text-muted-foreground">Resume, skills, jobs, and freelancing hub.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`${base}/alumni`}>Alumni</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`${base}/surveys`}>Surveys</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My portfolio / resume</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-2 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              save.mutate({
                headline: fd.get('headline'),
                summary: fd.get('summary'),
                skills: String(fd.get('skills') || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                socialLinks: {
                  linkedin: fd.get('linkedin'),
                  github: fd.get('github'),
                  portfolio: fd.get('portfolio'),
                },
                freelanceHub: {
                  ...(profile?.freelanceHub || {}),
                  portfolioReady: fd.get('portfolioReady') === 'on',
                  interviewPrepDone: fd.get('interviewPrep') === 'on',
                },
                submitForReview: fd.get('submit') === 'on',
              })
            }}
          >
            <input
              name="headline"
              defaultValue={profile?.headline || ''}
              placeholder="Headline"
              className="rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2"
            />
            <textarea
              name="summary"
              defaultValue={profile?.summary || ''}
              placeholder="Summary"
              className="min-h-24 rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2"
            />
            <input
              name="skills"
              defaultValue={(profile?.skills || []).join(', ')}
              placeholder="Skills (comma separated)"
              className="rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2"
            />
            <input
              name="linkedin"
              defaultValue={profile?.socialLinks?.linkedin || ''}
              placeholder="LinkedIn"
              className="rounded-xl border border-border bg-background px-3 py-2"
            />
            <input
              name="github"
              defaultValue={profile?.socialLinks?.github || ''}
              placeholder="GitHub"
              className="rounded-xl border border-border bg-background px-3 py-2"
            />
            <input
              name="portfolio"
              defaultValue={profile?.socialLinks?.portfolio || ''}
              placeholder="Portfolio URL"
              className="rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="portfolioReady" defaultChecked={profile?.freelanceHub?.portfolioReady} />
              Portfolio ready (freelance hub)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="interviewPrep" defaultChecked={profile?.freelanceHub?.interviewPrepDone} />
              Interview prep done
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="submit" /> Submit for teacher/admin approval
            </label>
            <Button className="sm:col-span-2" type="submit" disabled={save.isPending}>
              Save profile
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">Status: {profile?.status}</p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Job board</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(jobs || []).map((job) => (
            <JobCard
              key={job._id}
              job={job}
              href={`${base}/career/jobs/${job._id}`}
              actions={
                <>
                  <Button size="sm" onClick={() => apply.mutate(job._id)}>
                    Apply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => bookmark.mutate(job._id)}>
                    Bookmark
                  </Button>
                </>
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="text-lg font-bold">My applications</h2>
        {(apps || []).map((a) => (
          <div key={a._id} className="flex justify-between rounded-xl border border-border px-3 py-2">
            <span>{a.job?.title || a.job}</span>
            <span className="text-muted-foreground">{a.status}</span>
          </div>
        ))}
      </section>
    </PageTransition>
  )
}

export function JobDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => communicationService.getJob(id),
  })
  if (isLoading) return <PageLoader />
  return (
    <PageTransition className="space-y-4">
      <JobCard job={data} />
      {data?.applyLink && (
        <Button asChild>
          <a href={data.applyLink} target="_blank" rel="noreferrer">
            External apply link
          </a>
        </Button>
      )}
    </PageTransition>
  )
}

export function CareerAdminPage() {
  const qc = useQueryClient()
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    type: 'full_time',
    skillsRequired: '',
    description: '',
    salaryPlaceholder: '',
  })

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['career-profiles'],
    queryFn: () => communicationService.listCareers(),
  })

  const createJob = useMutation({
    mutationFn: () =>
      communicationService.createJob({
        ...jobForm,
        skillsRequired: jobForm.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
        status: 'published',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      setJobForm({
        title: '',
        company: '',
        type: 'full_time',
        skillsRequired: '',
        description: '',
        salaryPlaceholder: '',
      })
    },
  })

  const review = useMutation({
    mutationFn: ({ userId, status }) =>
      communicationService.reviewCareer(userId, { status, recommend: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['career-profiles'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <h1 className="text-2xl font-extrabold">Career admin</h1>
      <form
        className="grid gap-2 rounded-2xl border border-border p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          createJob.mutate()
        }}
      >
        <input
          required
          placeholder="Job title"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={jobForm.title}
          onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
        />
        <input
          required
          placeholder="Company"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={jobForm.company}
          onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
        />
        <select
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={jobForm.type}
          onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
        >
          {['full_time', 'part_time', 'remote', 'internship', 'freelance'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          placeholder="Salary placeholder"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={jobForm.salaryPlaceholder}
          onChange={(e) => setJobForm({ ...jobForm, salaryPlaceholder: e.target.value })}
        />
        <input
          placeholder="Skills (comma separated)"
          className="rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2"
          value={jobForm.skillsRequired}
          onChange={(e) => setJobForm({ ...jobForm, skillsRequired: e.target.value })}
        />
        <textarea
          placeholder="Description"
          className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2"
          value={jobForm.description}
          onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
        />
        <Button className="sm:col-span-2" type="submit">
          Publish job
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(profiles || []).map((p) => (
          <div key={p._id} className="space-y-2">
            <PortfolioCard profile={p} />
            {p.status === 'pending_review' && (
              <Button
                size="sm"
                onClick={() => review.mutate({ userId: p.user?._id || p.user, status: 'approved' })}
              >
                Approve & recommend
              </Button>
            )}
          </div>
        ))}
      </div>
    </PageTransition>
  )
}

export function SurveysPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const qc = useQueryClient()
  const staff = ['admin', 'super_admin', 'teacher'].includes(user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => communicationService.listSurveys(),
  })

  const create = useMutation({
    mutationFn: () =>
      communicationService.createSurvey({
        title: 'Course feedback',
        type: 'course_feedback',
        description: 'Help us improve',
        questions: [
          { key: 'q1', prompt: 'Overall rating', type: 'rating', required: true },
          { key: 'q2', prompt: 'Would you recommend?', type: 'yes_no', required: true },
          { key: 'q3', prompt: 'Comments', type: 'text', required: false },
        ],
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
  })
  const publish = useMutation({
    mutationFn: (id) => communicationService.publishSurvey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Feedback & surveys</h1>
        </div>
        {staff && (
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            Create sample survey
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {(data || []).map((s) => (
          <div key={s._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
            <div>
              <Link to={`${base}/surveys/${s._id}`} className="font-semibold hover:text-primary">
                {s.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {s.type} · {s.status}
              </p>
            </div>
            {staff && s.status === 'draft' && (
              <Button size="sm" onClick={() => publish.mutate(s._id)}>
                Publish
              </Button>
            )}
          </div>
        ))}
      </div>
    </PageTransition>
  )
}

export function SurveyTakePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => communicationService.getSurvey(id),
  })
  const { data: analytics } = useQuery({
    queryKey: ['survey-analytics', id],
    queryFn: () => communicationService.surveyAnalytics(id),
    enabled: ['admin', 'super_admin', 'teacher'].includes(user?.role),
  })
  const submit = useMutation({
    mutationFn: (answers) => communicationService.submitSurvey(id, answers),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      {data?.status === 'published' && (
        <SurveyForm
          survey={data}
          onSubmit={(answers) => submit.mutate(answers)}
        />
      )}
      {submit.isSuccess && <p className="text-sm text-emerald-600">Thanks for your feedback!</p>}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>Responses: {analytics.responseCount}</p>
            <p>Satisfaction score: {analytics.satisfactionScore ?? '—'}%</p>
            <p>NPS: architecture ready</p>
          </CardContent>
        </Card>
      )}
    </PageTransition>
  )
}

export function AlumniPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['alumni'],
    queryFn: () => communicationService.listAlumni(),
  })
  const { data: events } = useQuery({
    queryKey: ['alumni-events'],
    queryFn: () => communicationService.listAlumniEvents(),
  })

  const save = useMutation({
    mutationFn: (payload) => communicationService.upsertAlumni(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alumni'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Alumni network</h1>
        <p className="text-sm text-muted-foreground">Directory, mentorship, and meetup events.</p>
      </div>

      <form
        className="grid gap-2 rounded-2xl border border-border p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          save.mutate({
            graduationYear: fd.get('year'),
            currentRole: fd.get('role'),
            company: fd.get('company'),
            successStory: fd.get('story'),
            openToMentorship: fd.get('mentor') === 'on',
            visible: true,
          })
        }}
      >
        <input name="year" placeholder="Graduation year" className="rounded-xl border border-border bg-background px-3 py-2" />
        <input name="role" placeholder="Current role" className="rounded-xl border border-border bg-background px-3 py-2" />
        <input name="company" placeholder="Company" className="rounded-xl border border-border bg-background px-3 py-2" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="mentor" /> Open to mentorship
        </label>
        <textarea name="story" placeholder="Success story" className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2" />
        <Button className="sm:col-span-2" type="submit">
          Save alumni profile
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data || []).map((a) => (
          <div key={a._id} className="rounded-2xl border border-border p-4">
            <h3 className="font-semibold">{a.user?.fullName}</h3>
            <p className="text-sm text-muted-foreground">
              {a.currentRole} · {a.company}
            </p>
            <p className="mt-2 text-sm line-clamp-3">{a.successStory}</p>
            {a.openToMentorship && <p className="mt-2 text-xs text-teal-700">Open to mentorship</p>}
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Alumni events</h2>
        {(events || []).map((e) => (
          <div key={e._id} className="rounded-xl border border-border px-3 py-2 text-sm">
            <p className="font-medium">{e.title}</p>
            <p className="text-muted-foreground">
              {e.startsAt ? new Date(e.startsAt).toLocaleString() : ''} · {e.location}
            </p>
          </div>
        ))}
        {!events?.length && <p className="text-sm text-muted-foreground">No events yet (architecture ready).</p>}
      </section>
    </PageTransition>
  )
}
