import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/layouts/public-layout'
import { StudentLayout } from '@/layouts/student-layout'
import { TeacherLayout } from '@/layouts/teacher-layout'
import { AdminLayout } from '@/layouts/admin-layout'
import { SuperAdminLayout } from '@/layouts/super-admin-layout'
import { ProtectedRoute, GuestOnlyRoute } from '@/routes/protected-route'
import { ROLES, ROUTES } from '@/constants'

import LandingPage from '@/pages/landing'
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'
import ForgotPasswordPage from '@/pages/auth/forgot-password'
import ResetPasswordPage from '@/pages/auth/reset-password'
import ChangePasswordPage from '@/pages/auth/change-password'
import NotFoundPage from '@/pages/errors/not-found'
import ServerErrorPage from '@/pages/errors/server-error'
import UnauthorizedPage from '@/pages/errors/unauthorized'
import OfflinePage from '@/pages/errors/offline'
import SettingsPage from '@/pages/settings'
import StudentHomePage from '@/pages/student/home'
import StudentAssignmentsPage from '@/pages/student/assignments'
import TeacherHomePage from '@/pages/teacher/home'
import TeacherReviewsPage from '@/pages/teacher/reviews'
import AdminHomePage from '@/pages/admin/home'
import AdminUsersPage from '@/pages/admin/users'
import AdminSystemPage from '@/pages/admin/system'
import SuperAdminHomePage from '@/pages/super-admin/home'
import SuperAdminPlaceholderPage from '@/pages/super-admin/placeholder'
import { PortalPlaceholder } from '@/pages/_shared/portal-placeholder'
import CoursesListPage from '@/pages/courses/courses-list'
import CourseCreatePage from '@/pages/courses/course-create'
import CourseEditPage from '@/pages/courses/course-edit'
import CourseDetailsPage from '@/pages/courses/course-details'
import CategoriesListPage from '@/pages/categories/categories-list'
import CategoryCreatePage, { CategoryEditPage } from '@/pages/categories/category-form'
import BatchesListPage from '@/pages/batches/batches-list'
import CurriculumBuilderPage from '@/pages/curriculum/curriculum-builder'
import LessonEditPage from '@/pages/curriculum/lesson-edit'
import LessonViewPage from '@/pages/curriculum/lesson-view'
import StudentLearnPage from '@/pages/curriculum/student-learn'
import PracticeQuestionsListPage from '@/pages/practice/questions-list'
import PracticeQuestionFormPage from '@/pages/practice/question-form'
import PracticeAnalyticsPage from '@/pages/practice/analytics'
import { PracticePreviewPage } from '@/pages/practice/solve'
import StudentPracticeHomePage, { StudentQuestionPage } from '@/pages/practice/student-home'
import AssignmentsListPage from '@/pages/assignments/assignments-list'
import AssignmentFormPage from '@/pages/assignments/assignment-form'
import AssignmentAnalyticsPage from '@/pages/assignments/analytics'
import StudentAssignmentDetailPage from '@/pages/assignments/student-detail'
import AssignmentSubmissionsPage, { TeacherReviewPage } from '@/pages/assignments/teacher-review'
import QuizzesListPage from '@/pages/quizzes/quizzes-list'
import QuizFormPage from '@/pages/quizzes/quiz-form'
import QuizAnalyticsPage from '@/pages/quizzes/analytics'
import StudentQuizzesPage from '@/pages/student/quizzes'
import StudentQuizDetailPage, { QuizAttemptPage } from '@/pages/quizzes/take-quiz'
import QuizAttemptsPage, { QuizDetailHubPage } from '@/pages/quizzes/attempts'
import QuizPoolPage from '@/pages/quizzes/pool'
import EnrollmentsListPage from '@/pages/enrollment/enrollments-list'
import EnrollmentFormPage from '@/pages/enrollment/enrollment-form'
import EnrollmentDetailPage from '@/pages/enrollment/enrollment-detail'
import EnrollmentAnalyticsPage from '@/pages/enrollment/analytics'
import StudentEnrollmentsPage, { StudentProfilePage } from '@/pages/enrollment/student-home'
import BatchDetailPage from '@/pages/batches/batch-detail'
import LiveClassesListPage, { StudentClassesPage } from '@/pages/live/classes-list'
import LiveClassFormPage, { LiveClassDetailPage } from '@/pages/live/class-form'
import ClassAttendancePage, { StudentAttendancePage } from '@/pages/live/attendance'
import AcademicCalendarPage from '@/pages/live/calendar'
import AnnouncementsListPage, {
  AnnouncementFormPage,
  AnnouncementDetailPage,
} from '@/pages/live/announcements'
import LiveAdminDashboardPage from '@/pages/live/admin-dashboard'


export function AppRouter() {
  return (
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
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTES.SERVER_ERROR} element={<ServerErrorPage />} />
        <Route path={ROUTES.OFFLINE} element={<OfflinePage />} />
        <Route path="/404" element={<NotFoundPage />} />
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
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
