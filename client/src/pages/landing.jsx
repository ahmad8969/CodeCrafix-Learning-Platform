import { Link } from 'react-router-dom'
import { ArrowRight, Code2, Moon, Sparkles, Sun, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { APP_NAME, APP_TAGLINE, ROUTES } from '@/constants'
import { useTheme } from '@/contexts/theme-context'

const features = [
  { icon: Code2, title: 'Learn by building', body: 'Curriculum, coding workspace, practice, quizzes, and assignments.' },
  { icon: Zap, title: 'Operate at scale', body: 'Finance, CRM, helpdesk, live classes, and certificates in one SaaS LMS.' },
  { icon: Sparkles, title: 'Role-ready', body: 'Student, teacher, admin, and super-admin experiences — v1.0 Enterprise.' },
]

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="relative overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary glow-border">
              <Sparkles className="size-4" />
            </span>
            <span className="font-extrabold tracking-tight">{APP_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <Link to={ROUTES.STUDENT} className="hover:text-foreground">
              Student
            </Link>
            <Link to={ROUTES.TEACHER} className="hover:text-foreground">
              Teacher
            </Link>
            <Link to={ROUTES.ADMIN} className="hover:text-foreground">
              Admin
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to={ROUTES.LOGIN}>Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={ROUTES.LOGIN}>
                Get started <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-3xl"
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {APP_TAGLINE}
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">{APP_NAME}</span>
            <span className="mt-2 block text-foreground">Build skills. Ship confidence.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            CodeCrafters Learning Platform v1.0 Enterprise — a production-ready LMS for institutes
            with learning, communication, finance, and career workflows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={ROUTES.LOGIN}>
                Start learning <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={ROUTES.LOGIN}>Sign in to your portal</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <section id="features" className="border-t border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Features</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Enterprise capabilities shipped for students, teachers, and administrators.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-elevation-1"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
