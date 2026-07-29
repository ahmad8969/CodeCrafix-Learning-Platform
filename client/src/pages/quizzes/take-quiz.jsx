import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import {
  AnalysisChart,
  LeaderboardCard,
  QuestionCard,
  QuestionNavigator,
  QuizProgressBar,
  QuizTimer,
  ResultCard,
  ReviewPanel,
} from '@/components/quiz/quiz-widgets'
import { quizService } from '@/services/quiz.service'
import { ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

/** Student quiz detail: instructions → start. */
export default function StudentQuizDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizService.get(id),
  })
  const { data: history } = useQuery({
    queryKey: ['quiz-history', id],
    queryFn: () => quizService.history(id),
  })
  const { data: board } = useQuery({
    queryKey: ['quiz-leaderboard', id],
    queryFn: () => quizService.leaderboard(id),
  })

  const start = async () => {
    setStarting(true)
    try {
      const attempt = await quizService.start(id, {
        clientFingerprint: `${navigator.userAgent.slice(0, 40)}`,
      })
      navigate(`${ROUTES.STUDENT}/quizzes/attempts/${attempt._id}`)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setStarting(false)
    }
  }

  if (isLoading) return <PageLoader />
  if (!quiz) return <p className="p-6">Quiz not found</p>

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Quizzes', to: `${ROUTES.STUDENT}/quizzes` },
            { label: quiz.title },
          ]}
        />
        <div className="rounded-2xl border border-border bg-card p-5">
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{quiz.description}</p>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <li>Questions: {quiz.totalQuestions}</li>
            <li>Marks: {quiz.totalMarks}</li>
            <li>Time limit: {quiz.timeLimitMinutes} min</li>
            <li>Passing: {quiz.passingPercentage}%</li>
            <li>Max attempts: {quiz.maxAttempts || 'Unlimited'}</li>
            <li>Immediate result: {quiz.showResultImmediately ? 'Yes' : 'No'}</li>
          </ul>
          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm">
            {quiz.instructions || 'No special instructions.'}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={starting} onClick={start}>
              {starting ? 'Starting…' : 'Start quiz'}
            </Button>
            <Button variant="outline" asChild>
              <Link to={`${ROUTES.STUDENT}/quizzes`}>Back</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-bold">Your history</h2>
            <ul className="space-y-2 text-sm">
              {(history?.items || []).map((h) => (
                <li key={h._id}>
                  <Link
                    to={`${ROUTES.STUDENT}/quizzes/attempts/${h._id}`}
                    className="hover:text-primary"
                  >
                    Attempt #{h.attemptNumber} — {h.percentage}% ({h.status})
                  </Link>
                </li>
              ))}
              {!history?.items?.length && (
                <li className="text-xs text-muted-foreground">No prior attempts</li>
              )}
            </ul>
          </div>
          <LeaderboardCard entries={board?.entries || []} />
        </div>
      </div>
    </PageTransition>
  )
}

/** Active attempt runner + result view. */
export function QuizAttemptPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const autoFired = useRef(false)
  const answersRef = useRef({})

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['quiz-attempt', attemptId],
    queryFn: () => quizService.getAttempt(attemptId),
    refetchInterval: (q) => (q.state.data?.status === 'in_progress' ? 30000 : false),
  })

  useEffect(() => {
    if (!data) return
    if (data.status && data.status !== 'in_progress') {
      setResult(data)
      return
    }
    if (data.message && !data.questions) {
      setResult(data)
      return
    }
    const map = Object.fromEntries((data.answers || []).map((a) => [a.questionKey, a]))
    setAnswers(map)
    answersRef.current = map
  }, [data])

  const questions = data?.questions || []
  const current = questions[index]
  const answeredCount = useMemo(
    () =>
      questions.filter((q) => {
        const a = answers[q.questionKey]
        return (
          a &&
          !a.skipped &&
          ((a.selectedOptionIds || []).length || a.textAnswer || (a.codeSnapshot || []).length)
        )
      }).length,
    [questions, answers]
  )

  const persist = useCallback(
    async (nextMap) => {
      try {
        await quizService.saveProgress(attemptId, { answers: Object.values(nextMap) })
      } catch (e) {
        const msg = getErrorMessage(e)
        if (/locked|submitted|auto/i.test(msg)) {
          const fresh = await refetch()
          if (fresh.data?.status !== 'in_progress') setResult(fresh.data)
        }
      }
    },
    [attemptId, refetch]
  )

  const updateAnswer = (partial) => {
    setAnswers((prev) => {
      const next = { ...prev, [partial.questionKey]: { ...prev[partial.questionKey], ...partial } }
      answersRef.current = next
      persist(next)
      return next
    })
  }

  const submit = async (auto = false) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await quizService.submit(attemptId, {
        answers: Object.values(answersRef.current),
        auto,
      })
      setResult(res)
      setConfirmOpen(false)
      notify.success(auto ? 'Time up — quiz auto-submitted' : 'Quiz submitted')
    } catch (e) {
      notify.error(getErrorMessage(e))
      const fresh = await refetch()
      if (fresh.data?.status !== 'in_progress') setResult(fresh.data)
    } finally {
      setSubmitting(false)
    }
  }

  const onExpire = useCallback(() => {
    if (autoFired.current) return
    autoFired.current = true
    submit(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <PageLoader />

  if (result && result.status !== 'in_progress') {
    return (
      <PageTransition>
        <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
          <Breadcrumb
            items={[
              { label: 'Quizzes', to: `${ROUTES.STUDENT}/quizzes` },
              { label: 'Result' },
            ]}
          />
          {result.message && !result.analysis ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h1 className="text-xl font-bold">Submitted</h1>
              <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
              <Button className="mt-4" asChild>
                <Link to={`${ROUTES.STUDENT}/quizzes`}>Back to quizzes</Link>
              </Button>
            </div>
          ) : (
            <>
              <ResultCard result={result} />
              <AnalysisChart analysis={result.analysis} />
              {result.quiz?.enableReview && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold uppercase text-muted-foreground">Review</h2>
                  {(result.questions || []).map((q, i) => (
                    <QuestionCard
                      key={q.questionKey}
                      question={q}
                      answer={(result.answers || []).find((a) => a.questionKey === q.questionKey)}
                      disabled
                      showCorrect={result.showCorrectAnswers}
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button asChild>
                  <Link to={`${ROUTES.STUDENT}/quizzes`}>Done</Link>
                </Button>
                {result.quiz?._id && (
                  <Button variant="outline" asChild>
                    <Link to={`${ROUTES.STUDENT}/quizzes/${result.quiz._id}`}>Retake / details</Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </PageTransition>
    )
  }

  if (!current) {
    return (
      <div className="p-6">
        <p>No questions in this attempt.</p>
        <Button className="mt-3" onClick={() => navigate(`${ROUTES.STUDENT}/quizzes`)}>
          Back
        </Button>
      </div>
    )
  }

  const ans = answers[current.questionKey] || { questionKey: current.questionKey, type: current.type }

  return (
    <PageTransition>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumb items={[{ label: 'Quiz attempt' }]} />
          <QuizTimer endsAt={data?.endsAt} onExpire={onExpire} />
        </div>

        <QuizProgressBar current={index + 1} total={questions.length} answered={answeredCount} />
        <QuestionNavigator
          questions={questions}
          answersByKey={answers}
          currentKey={current.questionKey}
          onSelect={(_, i) => setIndex(i)}
        />

        <ReviewPanel
          bookmarked={Boolean(ans.bookmarked)}
          reviewedLater={Boolean(ans.reviewedLater)}
          onBookmark={() => updateAnswer({ ...ans, bookmarked: !ans.bookmarked })}
          onSkip={() => {
            updateAnswer({
              ...ans,
              skipped: true,
              selectedOptionIds: [],
              textAnswer: '',
            })
            setIndex((i) => Math.min(i + 1, questions.length - 1))
          }}
          onReviewLater={() => updateAnswer({ ...ans, reviewedLater: !ans.reviewedLater })}
        />

        <QuestionCard question={current} answer={ans} onChange={updateAnswer} />

        <div className="flex flex-wrap justify-between gap-2">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          <div className="flex gap-2">
            {index < questions.length - 1 ? (
              <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
            ) : (
              <Button onClick={() => setConfirmOpen(true)}>Submit quiz</Button>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Submit quiz?"
          description={`You answered ${answeredCount} of ${questions.length}. You cannot change answers after submission.`}
          confirmLabel={submitting ? 'Submitting…' : 'Submit'}
          onConfirm={() => submit(false)}
          loading={submitting}
        />
      </div>
    </PageTransition>
  )
}
