import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Badge from '../../components/ui/Badge'

import {
  CalendarDaysIcon,
  StarIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

function StatCard({ label, value, icon: Icon, color = 'text-brand' }) {
  return (
    <div className="card-sm flex items-center gap-4 fade-in">
      <div className="stat-icon bg-surface-low">
        {Icon ? <Icon className={`w-6 h-6 ${color}`} /> : null}
      </div>
      <div>
        <p className="stat-value">{value ?? '—'}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  )
}

function QuickAction({ label, icon: Icon, to, onClick, bgClass, colorClass }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) onClick()
    else navigate(to)
  }

  return (
    <button
      onClick={handleClick}
      className={`quick-action ${bgClass} ${colorClass}`}
      type="button"
    >
      <div className={`quick-action-icon ${bgClass}`}>
        {Icon ? <Icon className="w-6 h-6" /> : null}
      </div>
      <span className="text-xs font-600 text-center leading-tight">{label}</span>
    </button>
  )
}

function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [reqRes, sesRes] = await Promise.all([api.get('/requests/my'), api.get('/sessions/my')])
        setRequests(reqRes.data.data || [])
        setSessions(sesRes.data.data || [])
      } catch {
        setRequests([])
        setSessions([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const upcomingCount = sessions.filter(
    (s) => s.status === 'scheduled' || s.status === 'in_progress'
  ).length
  const completedCount = sessions.filter((s) => s.status === 'completed').length

  const recentRequests = requests.slice(0, 4)
  const recentSessions = sessions.slice(0, 4)

  const greeting =
    new Date().getHours() < 12
      ? 'Morning'
      : new Date().getHours() < 18
      ? 'Afternoon'
      : 'Evening'

  return (
    <div className="space-y-8 px-4 max-w-7xl mx-auto">
      <div className="fade-in">
        <h2 className="page-title">
          Good {greeting},{' '}
          <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span>
        </h2>
        <p className="body-text mt-1">Here is what is happening with your tutoring today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            label="Pending Requests"
            value={pendingCount}
            icon={ClipboardDocumentListIcon}
            color="text-warning-600"
          />
          <StatCard
            label="Upcoming Sessions"
            value={upcomingCount}
            icon={CalendarDaysIcon}
            color="text-brand"
          />
          <StatCard
            label="Completed Sessions"
            value={completedCount}
            icon={StarIcon}
            color="text-success-600"
          />
        </div>
      )}

      <div className="card p-6">
        <h3 className="section-title mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <QuickAction
            label="Browse Tutors"
            icon={MagnifyingGlassIcon}
            to="/student/tutors"
            bgClass="bg-tonal-brand"
            colorClass="text-brand"
          />
          <QuickAction
            label="My Requests"
            icon={ClipboardDocumentListIcon}
            to="/student/requests"
            bgClass="bg-tonal-warning"
            colorClass="text-warning-600"
          />
          <QuickAction
            label="My Sessions"
            icon={CalendarDaysIcon}
            to="/student/sessions"
            bgClass="bg-tonal-success"
            colorClass="text-success-600"
          />
          <QuickAction
            label="Give Feedback"
            icon={StarIcon}
            to="/student/feedback"
            bgClass="bg-surface-low"
            colorClass="text-ink-secondary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h3 className="section-title">Recent Requests</h3>
            <button
              className="btn-tertiary text-xs"
              onClick={() => navigate('/student/requests')}
              type="button"
            >
              View all →
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-ink-secondary text-sm italic">No requests found.</p>
          ) : (
            <ul className="space-y-3">
              {recentRequests.map((req) => (
                <li key={req.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-600 text-ink">{req.subject}</p>
                    <p className="caption-text">
                      {req.preferred_date} at {req.preferred_time}
                    </p>
                  </div>
                  <Badge status={req.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h3 className="section-title">Recent Sessions</h3>
            <button
              className="btn-tertiary text-xs"
              onClick={() => navigate('/student/sessions')}
              type="button"
            >
              View all →
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-ink-secondary text-sm italic">No sessions found.</p>
          ) : (
            <ul className="space-y-3">
              {recentSessions.map((ses) => (
                <li key={ses.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-600 text-ink">{ses.subject}</p>
                    <p className="caption-text">
                      {ses.session_date} at {ses.start_time}
                    </p>
                  </div>
                  <Badge status={ses.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard