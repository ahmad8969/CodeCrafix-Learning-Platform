import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { PageLoader } from '@/components/loaders'
import { gamificationService } from '@/services/certificate.service'
import { LeaderboardTable } from '@/components/certificates/certificate-widgets'

export default function LeaderboardPage() {
  const [scope, setScope] = useState('overall')
  const [metric, setMetric] = useState('xp')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', scope, metric],
    queryFn: () => gamificationService.leaderboard({ scope, metric, limit: 25 }),
  })

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Compete by XP, lessons, quizzes, and coding activity.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {['overall', 'weekly', 'monthly', 'all_time'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`rounded-full border px-3 py-1 text-sm ${scope === s ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ['xp', 'XP'],
          ['lessons', 'Lessons'],
          ['quiz', 'Quiz'],
          ['assignment', 'Assignments'],
          ['coding', 'Coding'],
        ].map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={`rounded-full border px-3 py-1 text-sm ${metric === m ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {isLoading ? <PageLoader /> : <LeaderboardTable items={data?.items || []} metricLabel={metric.toUpperCase()} />}
    </PageTransition>
  )
}
