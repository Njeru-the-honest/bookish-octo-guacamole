import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import ProtectedRoute  from '../components/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'

// Auth pages
import Login    from '../pages/auth/Login'
import Register from '../pages/auth/Register'

// Shared pages
import NotFound      from '../pages/NotFound'
import Unauthorized  from '../pages/Unauthorized'
import Notifications from '../pages/Notifications'

// Student pages
import StudentDashboard from '../pages/student/StudentDashboard'
import BrowseTutors     from '../pages/student/BrowseTutors'
import MyRequests       from '../pages/student/MyRequests'
import MySessions       from '../pages/student/MySessions'
import GiveFeedback     from '../pages/student/GiveFeedback'

// Tutor pages
import TutorDashboard    from '../pages/tutor/TutorDashboard'
import IncomingRequests  from '../pages/tutor/IncomingRequests'
import TutorSessions     from '../pages/tutor/TutorSessions'
import TutorProfile      from '../pages/tutor/TutorProfile'

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import Applications   from '../pages/admin/Applications'
import UserManagement from '../pages/admin/UserManagement'
import AllSessions    from '../pages/admin/AllSessions'
import Reports        from '../pages/admin/Reports'

import { getDefaultRoute } from '../utils/roleUtils'

// ─── Root redirect ────────────────────────────────────────────────────────────
function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return null

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRoute(user.role)} replace />
  }

  return <Navigate to="/login" replace />
}

// ─── Main router ──────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Error pages */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*"             element={<NotFound />} />

        {/* ── Student routes ───────────────────────────────────────── */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={
            <Navigate to="/student/dashboard" replace />
          } />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="tutors"    element={<BrowseTutors />} />
          <Route path="requests"  element={<MyRequests />} />
          <Route path="sessions"  element={<MySessions />} />
          <Route path="feedback"  element={<GiveFeedback />} />
        </Route>

        {/* ── Tutor routes ─────────────────────────────────────────── */}
        <Route
          path="/tutor"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={
            <Navigate to="/tutor/dashboard" replace />
          } />
          <Route path="dashboard" element={<TutorDashboard />} />
          <Route path="requests"  element={<IncomingRequests />} />
          <Route path="sessions"  element={<TutorSessions />} />
          <Route path="profile"   element={<TutorProfile />} />
        </Route>

        {/* ── Admin routes ─────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={
            <Navigate to="/admin/dashboard" replace />
          } />
          <Route path="dashboard"    element={<AdminDashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="users"        element={<UserManagement />} />
          <Route path="sessions"     element={<AllSessions />} />
          <Route path="reports"      element={<Reports />} />
        </Route>

        {/* ── Shared protected routes ──────────────────────────────── */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Notifications />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes