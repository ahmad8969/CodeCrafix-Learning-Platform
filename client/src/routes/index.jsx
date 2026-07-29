import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/layouts/public-layout'
import { StudentLayout } from '@/layouts/student-layout'
import { TeacherLayout } from '@/layouts/teacher-layout'
import { AdminLayout } from '@/layouts/admin-layout'
import { ProtectedRoute } from '@/routes/protected-route'
import { ROUTES } from '@/constants'

import LandingPage from '@/pages/landing'
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'
import ForgotPasswordPage from '@/pages/auth/forgot-password'
import ResetPasswordPage from '@/pages/auth/reset-password'
import NotFoundPage from '@/pages/errors/not-found'
import ServerErrorPage from '@/pages/errors/server-error'
import UnauthorizedPage from '@/pages/errors/unauthorized'
import OfflinePage from '@/pages/errors/offline'
import SettingsPage from '@/pages/settings'
import StudentHomePage from '@/pages/student/home'
import StudentCoursesPage from '@/pages/student/courses'
import StudentAssignmentsPage from '@/pages/student/assignments'
import TeacherHomePage from '@/pages/teacher/home'
import TeacherClassesPage from '@/pages/teacher/classes'
import TeacherReviewsPage from '@/pages/teacher/reviews'
import AdminHomePage from '@/pages/admin/home'
import AdminUsersPage from '@/pages/admin/users'
import AdminSystemPage from '@/pages/admin/system'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTES.SERVER_ERROR} element={<ServerErrorPage />} />
        <Route path={ROUTES.OFFLINE} element={<OfflinePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/404" element={<NotFoundPage />} />
      </Route>

      <Route
        path={ROUTES.STUDENT}
        element={
          <ProtectedRoute>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHomePage />} />
        <Route path="courses" element={<StudentCoursesPage />} />
        <Route path="assignments" element={<StudentAssignmentsPage />} />
      </Route>

      <Route
        path={ROUTES.TEACHER}
        element={
          <ProtectedRoute>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherHomePage />} />
        <Route path="classes" element={<TeacherClassesPage />} />
        <Route path="reviews" element={<TeacherReviewsPage />} />
      </Route>

      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHomePage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="system" element={<AdminSystemPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
