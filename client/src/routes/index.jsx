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
import StudentCoursesPage from '@/pages/student/courses'
import StudentAssignmentsPage from '@/pages/student/assignments'
import TeacherHomePage from '@/pages/teacher/home'
import TeacherClassesPage from '@/pages/teacher/classes'
import TeacherReviewsPage from '@/pages/teacher/reviews'
import AdminHomePage from '@/pages/admin/home'
import AdminUsersPage from '@/pages/admin/users'
import AdminSystemPage from '@/pages/admin/system'
import SuperAdminHomePage from '@/pages/super-admin/home'
import SuperAdminPlaceholderPage from '@/pages/super-admin/placeholder'
import { PortalPlaceholder } from '@/pages/_shared/portal-placeholder'

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
        <Route path="courses" element={<StudentCoursesPage />} />
        <Route path="assignments" element={<StudentAssignmentsPage />} />
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
        <Route path="classes" element={<TeacherClassesPage />} />
        <Route path="reviews" element={<TeacherReviewsPage />} />
        <Route
          path="courses"
          element={
            <PortalPlaceholder
              role="teacher"
              title="Courses"
              description="Teacher courses placeholder."
            />
          }
        />
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
        <Route
          path="courses"
          element={
            <PortalPlaceholder role="admin" title="Courses" description="Admin courses placeholder." />
          }
        />
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
        <Route path="courses" element={<SuperAdminPlaceholderPage title="Courses" />} />
        <Route path="reports" element={<SuperAdminPlaceholderPage title="Reports" />} />
        <Route path="system" element={<SuperAdminPlaceholderPage title="System" />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
