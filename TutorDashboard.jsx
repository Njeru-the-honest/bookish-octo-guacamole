import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import {
  formatStatus,
  getStatusBadgeClass,
  renderStars,
} from '../../utils/roleUtils'

import {
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

import QuickAction from '../../components/ui/QuickAction'
import Badge from '../../components/ui/Badge'

function StatCard({ label, value, icon: Icon, color = 'text-success-600' }) {
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

function RecentRow({ title, subtitle, status }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-600 text-ink truncate">{title}</p>
        <p className="caption-text mt-0.5">{subtitle}</p>
      </div>
      <span className={getStatusBadgeClass(status)}>{formatStatus(status)}</span>
    </div>
  )
}

function TutorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [sessions, setSessions] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [reqRes, sesRes, profileRes] = await Promise.all([
          api.get('/requests/incoming'),
          api.get('/sessions/my'),
          api.get('/tutors/profile/me'),
        ])
        setRequests(reqRes.data.data || [])
        setSessions(sesRes.data.data || [])
        setProfile(profileRes.data.data || null)
      } catch {
        setRequests([])
        setSessions([])
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const upcomingCount = sessions.filter(
    (s) => s.status === 'scheduled' || s.status === 'in_progress'
  ).length
  const completedCount = sessions.filter((s) => s.status === 'completed').length

  const recentRequests = requests.slice(0, 4)
  const recentSessions = sessions.slice(0, 4)

  const QUICK_ACTIONS = [
    {
      label: 'Incoming Requests',
      icon: ClipboardDocumentListIcon,
      to: '/tutor/requests',
      bgClass: 'bg-tonal-warning',
      colorClass: 'text-warning-600',
    },
    {
      label: 'My Sessions',
      icon: CalendarDaysIcon,
      to: '/tutor/sessions',
      bgClass: 'bg-tonal-brand',
      colorClass: 'text-brand',
    },
    {
      label: 'My Profile',
      icon: UserIcon,
      to: '/tutor/profile',
      bgClass: 'bg-tonal-success',
      colorClass: 'text-success-600',
    },
  ]

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
        <p className="body-text mt-1">Manage your tutoring requests and sessions.</p>
      </div>

      {profile && profile.total_reviews > 0 && (
        <div
          className="rounded-xl p-6 fade-in"
          style={{ background: 'linear-gradient(135deg, #003366 0%, #001e40 100%)' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">
                Your Rating
              </p>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-2xl">
                  {renderStars(Math.round(profile.average_rating))}
                </span>
                <span className="font-display font-bold text-white text-3xl">
                  {profile.average_rating?.toFixed(1)}
                </span>
                <span className="text-white/50 text-sm">/ 5</span>
              </div>
              <p className="text-white/50 text-xs mt-1">
                Based on {profile.total_reviews} review
                {profile.total_reviews !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="text-right text-white/75">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2">
                Subjects
              </p>
              <div className="flex flex-wrap gap-2 justify-end">
                {profile.subjects?.slice(0, 4).map((subject) => (
                  <span
                    key={subject}
                    className="px-3 py-1 rounded-lg text-xs font-semibold cursor-default bg-white/20"
                  >
                    {subject}
                  </span>
                ))}
                {profile.subjects?.length > 4 && (
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold cursor-default bg-white/20">
                    +{profile.subjects.length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
            icon={UserIcon}
            color="text-success-600"
          />
        </div>
      )}

      <div className="card p-6">
        <h3 className="section-title mb-5">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {QUICK_ACTIONS.map(({ label, icon, to, bgClass, colorClass }) => (
            <QuickAction
              key={to}
              label={label}
              icon={icon}
              to={to}
              bgClass={bgClass}
              colorClass={colorClass}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h3 className="section-title">Recent Requests</h3>
            <button
              className="btn-tertiary text-xs"
              onClick={() => navigate('/tutor/requests')}
              type="button"
            >
              View all →
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-ink-secondary text-sm italic">No requests yet</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((r) => (
                <div key={r.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ink">{r.subject}</p>
                    <p className="caption-text">
                      {r.preferred_date} at {r.preferred_time}
                    </p>
                  </div>
                  <Badge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h3 className="section-title">Recent Sessions</h3>
            <button
              className="btn-tertiary text-xs"
              onClick={() => navigate('/tutor/sessions')}
              type="button"
            >
              View all →
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-ink-secondary text-sm italic">No sessions yet</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ink">{s.subject}</p>
                    <p className="caption-text">
                      {s.session_date} at {s.start_time}
                    </p>
                  </div>
                  <Badge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TutorDashboard