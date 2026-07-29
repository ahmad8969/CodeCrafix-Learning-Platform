import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Breadcrumb } from '@/components/common/breadcrumb'
import {
  CourseProgressCard,
  StatusBadge,
} from '@/components/enrollment/enrollment-widgets'
import { enrollmentService } from '@/services/enrollment.service'
import { ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

export default function StudentEnrollmentsPage() {
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentService.list({ limit: 50 }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'My courses' }]} />
        <div>
          <h1 className="text-2xl font-bold">My enrollments</h1>
          <p className="text-sm text-muted-foreground">Courses and batches you belong to.</p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-4">
          <Input
            className="max-w-xs"
            placeholder="Enrollment code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            onClick={async () => {
              try {
                await enrollmentService.enrollByCode(code)
                notify.success('Enrolled')
                setCode('')
                queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })
              } catch (e) {
                notify.error(getErrorMessage(e))
              }
            }}
          >
            Join with code
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(data?.items || []).map((e) => (
            <CourseProgressCard
              key={e._id}
              title={e.course?.title || 'Course'}
              progress={e.overallProgress || 0}
              meta={`${e.batch?.name || 'No batch'} · ${e.status}`}
              href={`${ROUTES.STUDENT}/learn/${e.course?._id || e.course}`}
            />
          ))}
        </div>
        {!data?.items?.length && (
          <p className="text-sm text-muted-foreground">
            No enrollments yet. Ask your admin for a code or open your profile.
          </p>
        )}

        <Button variant="outline" asChild>
          <Link to={`${ROUTES.STUDENT}/profile`}>Open profile</Link>
        </Button>
      </div>
    </PageTransition>
  )
}

export function StudentProfilePage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: () => enrollmentService.myProfile(),
  })
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (data?.student) setForm(data.student)
  }, [data])

  if (isLoading || !form) return <PageLoader />
  const student = form

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Profile' }]} />
        <h1 className="text-2xl font-bold">Student profile</h1>

        <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[96px_1fr]">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl font-bold">
            {student.profileImage ? (
              <img src={student.profileImage} alt="" className="size-full object-cover" />
            ) : (
              (student.fullName || '?').slice(0, 1)
            )}
          </div>
          <div className="space-y-3">
            <Field
              label="Full name"
              value={student.fullName || ''}
              onChange={(v) => setForm({ ...student, fullName: v })}
            />
            <Field
              label="Phone"
              value={student.phoneNumber || ''}
              onChange={(v) => setForm({ ...student, phoneNumber: v })}
            />
            <Field
              label="Profile image URL"
              value={student.profileImage || ''}
              onChange={(v) => setForm({ ...student, profileImage: v })}
            />
            <Field
              label="Bio"
              value={student.bio || ''}
              onChange={(v) => setForm({ ...student, bio: v })}
            />
            <p className="text-xs text-muted-foreground">{student.email}</p>
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold">Guardian (optional)</h2>
          <Field
            label="Name"
            value={student.guardian?.name || ''}
            onChange={(v) =>
              setForm({ ...student, guardian: { ...(student.guardian || {}), name: v } })
            }
          />
          <Field
            label="Phone"
            value={student.guardian?.phone || ''}
            onChange={(v) =>
              setForm({ ...student, guardian: { ...(student.guardian || {}), phone: v } })
            }
          />
          <Field
            label="Email"
            value={student.guardian?.email || ''}
            onChange={(v) =>
              setForm({ ...student, guardian: { ...(student.guardian || {}), email: v } })
            }
          />
        </section>

        <Button
          onClick={async () => {
            try {
              await enrollmentService.updateProfile(student)
              notify.success('Profile saved')
              queryClient.invalidateQueries({ queryKey: ['student-profile-me'] })
              setForm(null)
            } catch (e) {
              notify.error(getErrorMessage(e))
            }
          }}
        >
          Save profile
        </Button>

        <section className="space-y-2">
          <h2 className="text-sm font-bold">Current courses</h2>
          {(data?.enrollments || []).map((e) => (
            <div key={e._id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{e.course?.title}</p>
                <p className="text-xs text-muted-foreground">{e.batch?.name || 'No batch'}</p>
              </div>
              <StatusBadge status={e.status} />
            </div>
          ))}
        </section>

        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Attendance and certificates placeholders — coming in later prompts.
        </div>
      </div>
    </PageTransition>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
