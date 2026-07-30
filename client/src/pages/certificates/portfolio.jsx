import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { gamificationService } from '@/services/certificate.service'
import {
  AchievementCard,
  BadgeCard,
  GamificationSummaryStrip,
  PortfolioTimeline,
  CertificateCard,
} from '@/components/certificates/certificate-widgets'
import { ROUTES } from '@/constants'

export default function StudentPortfolioPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['my-portfolio'],
    queryFn: () => gamificationService.myPortfolio(),
  })

  useEffect(() => {
    gamificationService.dailyLogin().catch(() => {})
  }, [])

  const visibility = useMutation({
    mutationFn: (pub) => gamificationService.setPortfolioVisibility(pub),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-portfolio'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Student portfolio</p>
          <h1 className="text-2xl font-extrabold">{data?.student?.fullName}</h1>
          <p className="text-sm text-muted-foreground">/{data?.portfolioSlug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!data?.portfolioPublic}
              onChange={(e) => visibility.mutate(e.target.checked)}
            />
            Public portfolio
          </label>
          <Button variant="outline" asChild>
            <Link to={`${ROUTES.STUDENT}/leaderboard`}>Leaderboard</Link>
          </Button>
          <Button asChild>
            <Link to={`${ROUTES.STUDENT}/certificates`}>Certificates</Link>
          </Button>
        </div>
      </div>

      <GamificationSummaryStrip
        summary={{
          totalXp: data?.xp,
          level: data?.level,
          levelInfo: data?.levelInfo,
          nextLevel: data?.nextLevel,
          progressToNextLevel: data?.progressToNextLevel,
          streakDays: data?.streakDays,
          longestStreak: data?.longestStreak,
          badges: data?.badges,
          achievements: data?.achievements?.filter((a) => a.unlocked),
        }}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Badges</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.badges || []).map((b) => (
            <BadgeCard key={b.key} badge={b} />
          ))}
          {!data?.badges?.length && <p className="text-sm text-muted-foreground">No badges yet</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Achievements</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.achievements || []).map((a) => (
            <AchievementCard key={a.key} item={a} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Certificates</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.certificates || []).map((c) => (
            <CertificateCard
              key={c._id}
              item={{ ...c, status: 'issued' }}
              href={`${ROUTES.STUDENT}/certificates/${c._id}`}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold">Learning timeline</h2>
          <PortfolioTimeline items={data?.timeline || []} />
        </div>
        <div className="space-y-4 text-sm">
          <h2 className="text-lg font-bold">Statistics</h2>
          <ul className="space-y-1 text-muted-foreground">
            <li>Lessons: {data?.stats?.lessonsCompleted || 0}</li>
            <li>Practice: {data?.stats?.practiceCompleted || 0}</li>
            <li>Assignments submitted: {data?.stats?.assignmentsSubmitted || 0}</li>
            <li>Quizzes passed: {data?.stats?.quizzesPassed || 0}</li>
            <li>Courses completed: {data?.stats?.coursesCompleted || 0}</li>
            <li>
              Coding time: {Math.round((data?.codingStatistics?.codingTimeSeconds || 0) / 60)} min
            </li>
          </ul>
          <h3 className="pt-2 font-semibold">Completed courses</h3>
          <ul className="space-y-1">
            {(data?.completedCourses || []).map((c) => (
              <li key={c.enrollmentId}>{c.course?.title}</li>
            ))}
          </ul>
        </div>
      </section>
    </PageTransition>
  )
}

export function PublicPortfolioPage() {
  const { slug } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-portfolio', slug],
    queryFn: () => gamificationService.publicPortfolio(slug),
    enabled: Boolean(slug),
  })
  if (isLoading) return <PageLoader />
  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Portfolio unavailable</h1>
        <p className="text-muted-foreground">This portfolio is private or does not exist.</p>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <p className="text-sm text-muted-foreground">Public portfolio</p>
        <h1 className="text-3xl font-extrabold">{data.student?.fullName}</h1>
      </div>
      <GamificationSummaryStrip
        summary={{
          totalXp: data.xp,
          level: data.level,
          levelInfo: data.levelInfo,
          nextLevel: data.nextLevel,
          progressToNextLevel: data.progressToNextLevel,
          streakDays: data.streakDays,
          longestStreak: data.longestStreak,
          badges: data.badges,
          achievements: data.achievements?.filter((a) => a.unlocked),
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(data.badges || []).map((b) => (
          <BadgeCard key={b.key} badge={b} />
        ))}
      </div>
      <PortfolioTimeline items={data.timeline || []} />
    </div>
  )
}
