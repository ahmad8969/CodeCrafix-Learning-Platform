import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/layouts/public-layout'
import { StudentLayout } from '@/layouts/student-layout'
import { TeacherLayout } from '@/layouts/teacher-layout'
import { AdminLayout } from '@/layouts/admin-layout'
import { SuperAdminLayout } from '@/layouts/super-admin-layout'
import { ProtectedRoute, GuestOnlyRoute } from '@/routes/protected-route'
import { ROLES, ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'
import * as P from '@/routes/lazy-pages'

const {
  LandingPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ChangePasswordPage,
  NotFoundPage,
  ServerErrorPage,
  UnauthorizedPage,
  OfflinePage,
  SettingsPage,
  StudentHomePage,
  StudentAssignmentsPage,
  TeacherHomePage,
  TeacherReviewsPage,
  AdminHomePage,
  AdminUsersPage,
  AdminSystemPage,
  SuperAdminHomePage,
  SuperAdminPlaceholderPage,
  PortalPlaceholder,
  CoursesListPage,
  CourseCreatePage,
  CourseEditPage,
  CourseDetailsPage,
  CategoriesListPage,
  CategoryCreatePage,
  CategoryEditPage,
  BatchesListPage,
  CurriculumBuilderPage,
  LessonEditPage,
  LessonViewPage,
  StudentLearnPage,
  PracticeQuestionsListPage,
  PracticeQuestionFormPage,
  PracticeAnalyticsPage,
  PracticePreviewPage,
  StudentPracticeHomePage,
  StudentQuestionPage,
  AssignmentsListPage,
  AssignmentFormPage,
  AssignmentAnalyticsPage,
  StudentAssignmentDetailPage,
  AssignmentSubmissionsPage,
  TeacherReviewPage,
  QuizzesListPage,
  QuizFormPage,
  QuizAnalyticsPage,
  StudentQuizzesPage,
  StudentQuizDetailPage,
  QuizAttemptPage,
  QuizAttemptsPage,
  QuizDetailHubPage,
  QuizPoolPage,
  EnrollmentsListPage,
  EnrollmentFormPage,
  EnrollmentDetailPage,
  EnrollmentAnalyticsPage,
  StudentEnrollmentsPage,
  StudentProfilePage,
  BatchDetailPage,
  LiveClassesListPage,
  StudentClassesPage,
  LiveClassFormPage,
  LiveClassDetailPage,
  ClassAttendancePage,
  StudentAttendancePage,
  AcademicCalendarPage,
  AnnouncementsListPage,
  AnnouncementFormPage,
  AnnouncementDetailPage,
  LiveAdminDashboardPage,
  CertificateVerifyPage,
  CertificatesListPage,
  CertificateDetailPage,
  CertificateTemplatesPage,
  CertificateRulesPage,
  StudentPortfolioPage,
  PublicPortfolioPage,
  LeaderboardPage,
  GamificationAdminPage,
  TeacherCertificatesPage,
  FinanceDashboardPage,
  AdmissionsPage,
  FeePlansPage,
  StudentFeesPage,
  FeeAccountDetailPage,
  ReceiptDetailPage,
  ReceiptVerifyPage,
  ExpensesPage,
  FinanceReportsPage,
  TeacherFeeStatusPage,
  MessagesPage,
  ForumsPage,
  ForumThreadPage,
  HelpdeskPage,
  TicketDetailPage,
  CrmPage,
  CareerPortalPage,
  JobDetailPage,
  CareerAdminPage,
  SurveysPage,
  SurveyTakePage,
  AlumniPage,
} = P

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route
          path={ROUTES.LOGIN}
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <GuestOnlyRoute>
              <RegisterPage />
            </GuestOnlyRoute>
          }
        />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTES.SERVER_ERROR} element={<ServerErrorPage />} />
        <Route path={ROUTES.OFFLINE} element={<OfflinePage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/verify/certificate/:token" element={<CertificateVerifyPage />} />
        <Route path="/verify/certificate" element={<CertificateVerifyPage />} />
        <Route path="/verify/receipt/:token" element={<ReceiptVerifyPage />} />
        <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />
      </Route>

      <Route
        path={ROUTES.SETTINGS}
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CHANGE_PASSWORD}
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT}
        element={
          <ProtectedRoute roles={[ROLES.STUDENT]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHomePage />} />
        <Route path="courses" element={<StudentEnrollmentsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="classes" element={<StudentClassesPage />} />
        <Route path="classes/:id" element={<LiveClassDetailPage />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="calendar" element={<AcademicCalendarPage />} />
        <Route path="announcements" element={<AnnouncementsListPage />} />
        <Route path="announcements/:id" element={<AnnouncementDetailPage />} />
        <Route path="assignments" element={<StudentAssignmentsPage />} />
        <Route path="assignments/:id" element={<StudentAssignmentDetailPage />} />
        <Route path="quizzes" element={<StudentQuizzesPage />} />
        <Route path="quizzes/attempts/:attemptId" element={<QuizAttemptPage />} />
        <Route path="quizzes/:id" element={<StudentQuizDetailPage />} />
        <Route path="practice" element={<StudentPracticeHomePage />} />
        <Route path="practice/questions/:questionId" element={<StudentQuestionPage />} />
        <Route path="learn/:courseId" element={<StudentLearnPage />} />
        <Route path="learn/:courseId/lessons/:lessonId" element={<LessonViewPage />} />
        <Route path="portfolio" element={<StudentPortfolioPage />} />
        <Route path="certificates" element={<CertificatesListPage />} />
        <Route path="certificates/:id" element={<CertificateDetailPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="fees" element={<StudentFeesPage />} />
        <Route path="fees/accounts/:id" element={<FeeAccountDetailPage />} />
        <Route path="fees/receipts/:id" element={<ReceiptDetailPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="forums" element={<ForumsPage />} />
        <Route path="forums/:id" element={<ForumThreadPage />} />
        <Route path="helpdesk" element={<HelpdeskPage />} />
        <Route path="helpdesk/:id" element={<TicketDetailPage />} />
        <Route path="career" element={<CareerPortalPage />} />
        <Route path="career/jobs/:id" element={<JobDetailPage />} />
        <Route path="surveys" element={<SurveysPage />} />
        <Route path="surveys/:id" element={<SurveyTakePage />} />
        <Route path="alumni" element={<AlumniPage />} />
      </Route>

      <Route
        path={ROUTES.TEACHER}
        element={
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherHomePage />} />
        <Route path="classes" element={<LiveClassesListPage />} />
        <Route path="classes/new" element={<LiveClassFormPage />} />
        <Route path="classes/:id/edit" element={<LiveClassFormPage />} />
        <Route path="classes/:id/attendance" element={<ClassAttendancePage />} />
        <Route path="classes/:id" element={<LiveClassDetailPage />} />
        <Route path="calendar" element={<AcademicCalendarPage />} />
        <Route path="announcements" element={<AnnouncementsListPage />} />
        <Route path="announcements/new" element={<AnnouncementFormPage />} />
        <Route path="announcements/:id" element={<AnnouncementDetailPage />} />
        <Route path="batches" element={<BatchesListPage />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />
        <Route path="enrollments" element={<EnrollmentsListPage />} />
        <Route path="enrollments/new" element={<EnrollmentFormPage />} />
        <Route path="enrollments/analytics" element={<EnrollmentAnalyticsPage />} />
        <Route path="enrollments/:id" element={<EnrollmentDetailPage />} />
        <Route path="reviews" element={<TeacherReviewsPage />} />
        <Route path="courses" element={<CoursesListPage />} />
        <Route path="courses/:id" element={<CourseDetailsPage />} />
        <Route path="courses/:id/curriculum" element={<CurriculumBuilderPage />} />
        <Route path="courses/:id/curriculum/lessons/:lessonId" element={<LessonViewPage />} />
        <Route path="courses/:id/curriculum/lessons/:lessonId/edit" element={<LessonEditPage />} />
        <Route path="practice" element={<PracticeQuestionsListPage />} />
        <Route path="practice/new" element={<PracticeQuestionFormPage />} />
        <Route path="practice/analytics" element={<PracticeAnalyticsPage />} />
        <Route path="practice/:id" element={<PracticePreviewPage />} />
        <Route path="practice/:id/edit" element={<PracticeQuestionFormPage />} />
        <Route path="assignments" element={<AssignmentsListPage />} />
        <Route path="assignments/new" element={<AssignmentFormPage />} />
        <Route path="assignments/analytics" element={<AssignmentAnalyticsPage />} />
        <Route path="assignments/:id" element={<AssignmentSubmissionsPage />} />
        <Route path="assignments/:id/edit" element={<AssignmentFormPage />} />
        <Route path="assignments/:id/submissions" element={<AssignmentSubmissionsPage />} />
        <Route path="assignments/:id/submissions/:submissionId" element={<TeacherReviewPage />} />
        <Route path="quizzes" element={<QuizzesListPage />} />
        <Route path="quizzes/new" element={<QuizFormPage />} />
        <Route path="quizzes/analytics" element={<QuizAnalyticsPage />} />
        <Route path="quizzes/:id/edit" element={<QuizFormPage />} />
        <Route path="quizzes/:id/attempts" element={<QuizAttemptsPage />} />
        <Route path="quizzes/:id" element={<QuizDetailHubPage />} />
        <Route path="achievements" element={<TeacherCertificatesPage />} />
        <Route path="certificates" element={<CertificatesListPage />} />
        <Route path="certificates/:id" element={<CertificateDetailPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="fee-status" element={<TeacherFeeStatusPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="forums" element={<ForumsPage />} />
        <Route path="forums/:id" element={<ForumThreadPage />} />
        <Route path="helpdesk" element={<HelpdeskPage />} />
        <Route path="helpdesk/:id" element={<TicketDetailPage />} />
        <Route path="career" element={<CareerPortalPage />} />
        <Route path="career/jobs/:id" element={<JobDetailPage />} />
        <Route path="surveys" element={<SurveysPage />} />
        <Route path="surveys/:id" element={<SurveyTakePage />} />
        <Route path="alumni" element={<AlumniPage />} />
      </Route>

      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHomePage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="system" element={<AdminSystemPage />} />
        <Route
          path="teachers"
          element={
            <PortalPlaceholder role="admin" title="Teachers" description="Admin teachers placeholder." />
          }
        />
        <Route path="live-overview" element={<LiveAdminDashboardPage />} />
        <Route path="classes" element={<LiveClassesListPage />} />
        <Route path="classes/new" element={<LiveClassFormPage />} />
        <Route path="classes/:id/edit" element={<LiveClassFormPage />} />
        <Route path="classes/:id/attendance" element={<ClassAttendancePage />} />
        <Route path="classes/:id" element={<LiveClassDetailPage />} />
        <Route path="calendar" element={<AcademicCalendarPage />} />
        <Route path="announcements" element={<AnnouncementsListPage />} />
        <Route path="announcements/new" element={<AnnouncementFormPage />} />
        <Route path="announcements/:id" element={<AnnouncementDetailPage />} />
        <Route path="courses" element={<CoursesListPage />} />
        <Route path="courses/new" element={<CourseCreatePage />} />
        <Route path="courses/:id" element={<CourseDetailsPage />} />
        <Route path="courses/:id/edit" element={<CourseEditPage />} />
        <Route path="courses/:id/curriculum" element={<CurriculumBuilderPage />} />
        <Route path="courses/:id/curriculum/lessons/:lessonId" element={<LessonViewPage />} />
        <Route path="courses/:id/curriculum/lessons/:lessonId/edit" element={<LessonEditPage />} />
        <Route path="categories" element={<CategoriesListPage />} />
        <Route path="categories/new" element={<CategoryCreatePage />} />
        <Route path="categories/:id/edit" element={<CategoryEditPage />} />
        <Route path="batches" element={<BatchesListPage />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />
        <Route path="enrollments" element={<EnrollmentsListPage />} />
        <Route path="enrollments/new" element={<EnrollmentFormPage />} />
        <Route path="enrollments/analytics" element={<EnrollmentAnalyticsPage />} />
        <Route path="enrollments/:id" element={<EnrollmentDetailPage />} />
        <Route path="practice" element={<PracticeQuestionsListPage />} />
        <Route path="practice/new" element={<PracticeQuestionFormPage />} />
        <Route path="practice/analytics" element={<PracticeAnalyticsPage />} />
        <Route path="practice/:id" element={<PracticePreviewPage />} />
        <Route path="practice/:id/edit" element={<PracticeQuestionFormPage />} />
        <Route path="assignments" element={<AssignmentsListPage />} />
        <Route path="assignments/new" element={<AssignmentFormPage />} />
        <Route path="assignments/analytics" element={<AssignmentAnalyticsPage />} />
        <Route path="assignments/:id" element={<AssignmentSubmissionsPage />} />
        <Route path="assignments/:id/edit" element={<AssignmentFormPage />} />
        <Route path="assignments/:id/submissions" element={<AssignmentSubmissionsPage />} />
        <Route path="assignments/:id/submissions/:submissionId" element={<TeacherReviewPage />} />
        <Route path="quizzes" element={<QuizzesListPage />} />
        <Route path="quizzes/new" element={<QuizFormPage />} />
        <Route path="quizzes/analytics" element={<QuizAnalyticsPage />} />
        <Route path="quizzes/pool" element={<QuizPoolPage />} />
        <Route path="quizzes/:id/edit" element={<QuizFormPage />} />
        <Route path="quizzes/:id/attempts" element={<QuizAttemptsPage />} />
        <Route path="quizzes/:id" element={<QuizDetailHubPage />} />
        <Route path="gamification" element={<GamificationAdminPage />} />
        <Route path="certificates" element={<CertificatesListPage />} />
        <Route path="certificates/:id" element={<CertificateDetailPage />} />
        <Route path="certificate-templates" element={<CertificateTemplatesPage />} />
        <Route path="certificate-rules" element={<CertificateRulesPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="finance" element={<FinanceDashboardPage />} />
        <Route path="finance/admissions" element={<AdmissionsPage />} />
        <Route path="finance/fee-plans" element={<FeePlansPage />} />
        <Route path="finance/expenses" element={<ExpensesPage />} />
        <Route path="finance/reports" element={<FinanceReportsPage />} />
        <Route path="finance/accounts/:id" element={<FeeAccountDetailPage />} />
        <Route path="finance/receipts/:id" element={<ReceiptDetailPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="forums" element={<ForumsPage />} />
        <Route path="forums/:id" element={<ForumThreadPage />} />
        <Route path="helpdesk" element={<HelpdeskPage />} />
        <Route path="helpdesk/:id" element={<TicketDetailPage />} />
        <Route path="crm" element={<CrmPage />} />
        <Route path="career" element={<CareerPortalPage />} />
        <Route path="career/admin" element={<CareerAdminPage />} />
        <Route path="career/jobs/:id" element={<JobDetailPage />} />
        <Route path="surveys" element={<SurveysPage />} />
        <Route path="surveys/:id" element={<SurveyTakePage />} />
        <Route path="alumni" element={<AlumniPage />} />
      </Route>

      <Route
        path={ROUTES.SUPER_ADMIN}
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminHomePage />} />
        <Route path="users" element={<SuperAdminPlaceholderPage title="All Users" />} />
        <Route path="admins" element={<SuperAdminPlaceholderPage title="Admins" />} />
        <Route path="classes" element={<LiveClassesListPage />} />
        <Route path="classes/new" element={<LiveClassFormPage />} />
        <Route path="classes/:id/edit" element={<LiveClassFormPage />} />
        <Route path="classes/:id/attendance" element={<ClassAttendancePage />} />
        <Route path="classes/:id" element={<LiveClassDetailPage />} />
        <Route path="calendar" element={<AcademicCalendarPage />} />
        <Route path="announcements" element={<AnnouncementsListPage />} />
        <Route path="announcements/new" element={<AnnouncementFormPage />} />
        <Route path="announcements/:id" element={<AnnouncementDetailPage />} />
        <Route path="courses" element={<CoursesListPage />} />
        <Route path="courses/new" element={<CourseCreatePage />} />
        <Route path="courses/:id" element={<CourseDetailsPage />} />
        <Route path="courses/:id/edit" element={<CourseEditPage />} />
        <Route path="courses/:id/curriculum" element={<CurriculumBuilderPage />} />
        <Route path="courses/:id/curriculum/lessons/:lessonId" element={<LessonViewPage />} />
        <Route path="courses/:id/curriculum/lessons/:lessonId/edit" element={<LessonEditPage />} />
        <Route path="categories" element={<CategoriesListPage />} />
        <Route path="categories/new" element={<CategoryCreatePage />} />
        <Route path="categories/:id/edit" element={<CategoryEditPage />} />
        <Route path="batches" element={<BatchesListPage />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />
        <Route path="enrollments" element={<EnrollmentsListPage />} />
        <Route path="enrollments/new" element={<EnrollmentFormPage />} />
        <Route path="enrollments/analytics" element={<EnrollmentAnalyticsPage />} />
        <Route path="enrollments/:id" element={<EnrollmentDetailPage />} />
        <Route path="practice" element={<PracticeQuestionsListPage />} />
        <Route path="practice/new" element={<PracticeQuestionFormPage />} />
        <Route path="practice/analytics" element={<PracticeAnalyticsPage />} />
        <Route path="practice/:id" element={<PracticePreviewPage />} />
        <Route path="practice/:id/edit" element={<PracticeQuestionFormPage />} />
        <Route path="assignments" element={<AssignmentsListPage />} />
        <Route path="assignments/new" element={<AssignmentFormPage />} />
        <Route path="assignments/analytics" element={<AssignmentAnalyticsPage />} />
        <Route path="assignments/:id" element={<AssignmentSubmissionsPage />} />
        <Route path="assignments/:id/edit" element={<AssignmentFormPage />} />
        <Route path="assignments/:id/submissions" element={<AssignmentSubmissionsPage />} />
        <Route path="assignments/:id/submissions/:submissionId" element={<TeacherReviewPage />} />
        <Route path="quizzes" element={<QuizzesListPage />} />
        <Route path="quizzes/new" element={<QuizFormPage />} />
        <Route path="quizzes/analytics" element={<QuizAnalyticsPage />} />
        <Route path="quizzes/pool" element={<QuizPoolPage />} />
        <Route path="quizzes/:id/edit" element={<QuizFormPage />} />
        <Route path="quizzes/:id/attempts" element={<QuizAttemptsPage />} />
        <Route path="quizzes/:id" element={<QuizDetailHubPage />} />
        <Route path="reports" element={<SuperAdminPlaceholderPage title="Reports" />} />
        <Route path="system" element={<SuperAdminPlaceholderPage title="System" />} />
        <Route path="gamification" element={<GamificationAdminPage />} />
        <Route path="certificates" element={<CertificatesListPage />} />
        <Route path="certificates/:id" element={<CertificateDetailPage />} />
        <Route path="certificate-templates" element={<CertificateTemplatesPage />} />
        <Route path="certificate-rules" element={<CertificateRulesPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="finance" element={<FinanceDashboardPage />} />
        <Route path="finance/admissions" element={<AdmissionsPage />} />
        <Route path="finance/fee-plans" element={<FeePlansPage />} />
        <Route path="finance/expenses" element={<ExpensesPage />} />
        <Route path="finance/reports" element={<FinanceReportsPage />} />
        <Route path="finance/accounts/:id" element={<FeeAccountDetailPage />} />
        <Route path="finance/receipts/:id" element={<ReceiptDetailPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="forums" element={<ForumsPage />} />
        <Route path="forums/:id" element={<ForumThreadPage />} />
        <Route path="helpdesk" element={<HelpdeskPage />} />
        <Route path="helpdesk/:id" element={<TicketDetailPage />} />
        <Route path="crm" element={<CrmPage />} />
        <Route path="career" element={<CareerPortalPage />} />
        <Route path="career/admin" element={<CareerAdminPage />} />
        <Route path="career/jobs/:id" element={<JobDetailPage />} />
        <Route path="surveys" element={<SurveysPage />} />
        <Route path="surveys/:id" element={<SurveyTakePage />} />
        <Route path="alumni" element={<AlumniPage />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </Suspense>
  )
}

export default AppRouter
