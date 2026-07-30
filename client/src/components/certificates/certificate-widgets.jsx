import { Link } from 'react-router-dom'
import { Award, Flame, Medal, Trophy, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function XpProgressBar({ totalXp = 0, progress = 0, level = 1, nextLevel, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold flex items-center gap-1.5">
          <Zap className="size-4 text-amber-500" /> Level {level}
          {nextLevel?.title ? ` · ${nextLevel.title}` : ''}
        </span>
        <span className="text-muted-foreground">{totalXp} XP</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all"
          style={{ width: `${Math.min(100, progress || 0)}%` }}
        />
      </div>
      {nextLevel && (
        <p className="text-xs text-muted-foreground">
          {Math.max(0, (nextLevel.xpRequired || 0) - totalXp)} XP to level {nextLevel.level}
        </p>
      )}
    </div>
  )
}

export function LevelCard({ level, title, xp }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-teal-50 to-emerald-50 p-4 dark:from-teal-950/40 dark:to-emerald-950/30">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Current level</p>
      <p className="mt-1 text-3xl font-extrabold text-teal-800 dark:text-teal-200">{level}</p>
      <p className="text-sm font-medium">{title || `Level ${level}`}</p>
      <p className="mt-2 text-xs text-muted-foreground">{xp} total XP</p>
    </div>
  )
}

export function BadgeCard({ badge, definition }) {
  const def = definition || badge?.definition || badge
  const tier = def?.tier || 'bronze'
  const colors = {
    bronze: 'from-amber-700/20 to-amber-500/10 border-amber-700/30',
    silver: 'from-slate-400/20 to-slate-200/10 border-slate-400/40',
    gold: 'from-yellow-500/20 to-amber-300/10 border-yellow-500/40',
    platinum: 'from-cyan-500/20 to-slate-200/10 border-cyan-500/40',
    diamond: 'from-sky-400/30 to-indigo-300/10 border-sky-400/50',
    custom: 'from-teal-500/20 to-emerald-300/10 border-teal-500/40',
  }
  return (
    <div className={cn('rounded-2xl border bg-gradient-to-br p-4', colors[tier] || colors.custom)}>
      <div className="mb-2 flex items-center gap-2">
        <Medal className="size-5" />
        <Badge variant="secondary">{tier}</Badge>
      </div>
      <h3 className="font-semibold">{def?.label || badge?.key}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{def?.description}</p>
    </div>
  )
}

export function AchievementCard({ item }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border p-4',
        item.unlocked ? 'bg-card' : 'bg-muted/40 opacity-70'
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Trophy className={cn('size-5', item.unlocked ? 'text-amber-500' : 'text-muted-foreground')} />
        {item.unlocked ? <Badge>Unlocked</Badge> : <Badge variant="outline">Locked</Badge>}
      </div>
      <h3 className="font-semibold">{item.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
      {item.unlockedAt && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {new Date(item.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

export function CertificateCard({ item, href }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge>{item.status || 'issued'}</Badge>
        <Badge variant="secondary">{item.type}</Badge>
      </div>
      {href ? (
        <Link to={href} className="text-lg font-semibold hover:text-primary">
          {item.courseName || item.title}
        </Link>
      ) : (
        <h3 className="text-lg font-semibold">{item.courseName || item.title}</h3>
      )}
      <p className="mt-1 font-mono text-xs text-muted-foreground">{item.certificateNumber}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {item.issuedAt ? new Date(item.issuedAt).toLocaleDateString() : 'Pending'}
      </p>
    </div>
  )
}

export function CertificateViewer({ certificate }) {
  if (!certificate) return null
  const snap = certificate.snapshot || {}
  const primary = snap.primaryColor || '#0d9488'
  const verifyUrl = certificate.verificationUrl || certificate.qrPayload
  const qrSrc = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`
    : null

  return (
    <div
      className="relative overflow-hidden rounded-3xl border-2 bg-white p-8 text-slate-900 shadow-lg"
      style={{
        borderColor: primary,
        backgroundImage: snap.backgroundUrl ? `url(${snap.backgroundUrl})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      <div className="relative z-10 space-y-6 text-center">
        {snap.logoUrl && (
          <img src={snap.logoUrl} alt="Institute" className="mx-auto h-14 object-contain" />
        )}
        <p className="text-sm uppercase tracking-[0.2em]" style={{ color: primary }}>
          {certificate.title || 'Certificate of Completion'}
        </p>
        <h2 className="font-serif text-3xl font-bold md:text-4xl">{certificate.studentName}</h2>
        <p className="mx-auto max-w-xl text-sm text-slate-600">
          {(snap.bodyText || 'Successfully completed {{courseName}}.')
            .replace(/\{\{\s*studentName\s*\}\}/g, certificate.studentName || '')
            .replace(/\{\{\s*courseName\s*\}\}/g, certificate.courseName || '')}
        </p>
        <p className="text-lg font-semibold" style={{ color: snap.accentColor || primary }}>
          {certificate.courseName}
        </p>
        <div className="flex flex-wrap items-end justify-center gap-8 pt-4">
          <div>
            <p className="text-xs text-slate-500">Completion date</p>
            <p className="font-medium">
              {certificate.completionDate
                ? new Date(certificate.completionDate).toLocaleDateString()
                : '—'}
            </p>
          </div>
          {certificate.instructorName && (
            <div>
              <p className="text-xs text-slate-500">Instructor</p>
              <p className="font-medium">{certificate.instructorName}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500">Certificate no.</p>
            <p className="font-mono text-sm">{certificate.certificateNumber}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
          {(snap.signatures || []).map((s, i) => (
            <div key={i} className="min-w-[120px]">
              {s.imageUrl && <img src={s.imageUrl} alt="" className="mx-auto h-10 object-contain" />}
              <p className="mt-1 text-sm font-medium">{s.name}</p>
              <p className="text-xs text-slate-500">{s.title}</p>
            </div>
          ))}
          {snap.showSeal !== false && snap.sealUrl && (
            <img src={snap.sealUrl} alt="Seal" className="h-16 object-contain opacity-80" />
          )}
          {snap.showQr !== false && qrSrc && (
            <div>
              <img src={qrSrc} alt="QR verification" className="mx-auto size-[120px]" />
              <p className="mt-1 text-[10px] text-slate-500">Scan to verify</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function QrVerificationCard({ result }) {
  if (!result) return null
  return (
    <div
      className={cn(
        'rounded-2xl border p-6',
        result.valid ? 'border-emerald-500/40 bg-emerald-50/50' : 'border-destructive/40 bg-destructive/5'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Award className={result.valid ? 'text-emerald-600' : 'text-destructive'} />
        <h2 className="text-lg font-bold">{result.valid ? 'Verified' : 'Not valid'}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{result.message}</p>
      {result.studentName && (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Student</dt>
            <dd className="font-semibold">{result.studentName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Course</dt>
            <dd className="font-semibold">{result.courseName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completed</dt>
            <dd>
              {result.completionDate ? new Date(result.completionDate).toLocaleDateString() : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <Badge>{result.status}</Badge>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Certificate number</dt>
            <dd className="font-mono">{result.certificateNumber}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}

export function LeaderboardTable({ items = [], metricLabel = 'XP' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Student</th>
            <th className="px-4 py-3 font-medium">{metricLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.user?._id || row.rank} className="border-t border-border">
              <td className="px-4 py-3 font-semibold">#{row.rank}</td>
              <td className="px-4 py-3">{row.user?.fullName || '—'}</td>
              <td className="px-4 py-3">{row.value}</td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                No rankings yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function PortfolioTimeline({ items = [] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full bg-teal-600" />
          <p className="text-sm font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {item.at ? new Date(item.at).toLocaleString() : ''} · {item.type}
          </p>
        </li>
      ))}
      {!items.length && <p className="text-sm text-muted-foreground">No activity yet</p>}
    </ol>
  )
}

export function StreakBadge({ days = 0 }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-700 dark:text-orange-300">
      <Flame className="size-4" /> {days}-day streak
    </div>
  )
}

export function CertificateTemplateDesigner({ value, onChange }) {
  const v = value || {}
  const set = (key, val) => onChange?.({ ...v, [key]: val })
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        {[
          ['name', 'Template name'],
          ['titleText', 'Title text'],
          ['logoUrl', 'Logo URL'],
          ['backgroundUrl', 'Background URL'],
          ['sealUrl', 'Seal URL'],
          ['primaryColor', 'Primary color'],
          ['accentColor', 'Accent color'],
        ].map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block text-muted-foreground">{label}</span>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={v[key] || ''}
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        ))}
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Body text</span>
          <textarea
            className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2"
            value={v.bodyText || ''}
            onChange={(e) => set('bodyText', e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-3 text-sm">
          {['showQr', 'showSeal', 'showInstructor', 'isDefault', 'active'].map((key) => (
            <label key={key} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={v[key] !== false && (key === 'active' || key === 'isDefault' ? !!v[key] || key !== 'isDefault' : v[key] !== false)}
                onChange={(e) => set(key, e.target.checked)}
              />
              {key}
            </label>
          ))}
        </div>
      </div>
      <CertificateViewer
        certificate={{
          title: v.titleText || 'Certificate of Completion',
          studentName: 'Alex Student',
          courseName: 'Sample Course',
          instructorName: 'Jane Instructor',
          completionDate: new Date().toISOString(),
          certificateNumber: 'CC-PREVIEW-0001',
          verificationUrl: 'https://example.com/verify/preview',
          snapshot: v,
        }}
      />
    </div>
  )
}

export function GamificationSummaryStrip({ summary, portfolioHref }) {
  if (!summary) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <LevelCard
        level={summary.level}
        title={summary.levelInfo?.title}
        xp={summary.totalXp}
      />
      <div className="rounded-2xl border border-border bg-card p-4">
        <XpProgressBar
          totalXp={summary.totalXp}
          progress={summary.progressToNextLevel}
          level={summary.level}
          nextLevel={summary.nextLevel}
        />
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-center gap-2">
        <StreakBadge days={summary.streakDays || 0} />
        <p className="text-xs text-muted-foreground">Longest: {summary.longestStreak || 0} days</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-center gap-2">
        <p className="text-sm text-muted-foreground">
          {(summary.badges || []).length} badges · {(summary.achievements || []).length} achievements
        </p>
        {portfolioHref && (
          <Button asChild size="sm" variant="outline">
            <Link to={portfolioHref}>Open portfolio</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
