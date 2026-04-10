import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Badge from '../../components/ui/Badge'

import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  StarIcon,
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

function StatGroup({ title, stats }) {
  return (
    <div>
      <p className="label-text mb-3">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ title, linkTo, linkLabel }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="section-title">{title}</h3>
      {linkTo && (
        <button
          onClick={() => navigate(linkTo)}
          className="btn-tertiary text-xs"
          type="button"
        >
          {linkLabel || 'View all'} →
        </button>
      )}
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentSessions, setRecentSessions] = useState([])
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, sessionsRes, requestsRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/reports/sessions?limit=5'),
          api.get('/admin/reports/requests?limit=5'),
        ])
        setStats(statsRes.data.data)
        setRecentSessions(sessionsRes.data.data || [])
        setRecentRequests(requestsRes.data.data || [])
      } catch {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const USER_STATS = [
    { label: 'Total Users', icon: UserGroupIcon, value: stats?.users?.total, color: 'text-brand' },
    {
      label: 'Students',
      icon: UserGroupIcon,
      value: stats?.users?.students,
      color: 'text-ink-secondary',
    },
    {
      label: 'Tutors',
      icon: UserGroupIcon,
      value: stats?.users?.tutors,
      color: 'text-success-600',
    },
    {
      label: 'Admins',
      icon: UserGroupIcon,
      value: stats?.users?.admins,
      color: 'text-ink-secondary',
    },
  ]

  const APP_STATS = [
    {
      label: 'Total Applications',
      icon: ClipboardDocumentListIcon,
      value: stats?.tutor_applications?.total,
      color: 'text-ink-secondary',
    },
    {
      label: 'Pending Applications',
      icon: ClipboardDocumentListIcon,
      value: stats?.tutor_applications?.pending,
      color: 'text-warning-600',
    },
    {
      label: 'Approved Applications',
      icon: ClipboardDocumentListIcon,
      value: stats?.tutor_applications?.approved,
      color: 'text-success-600',
    },
    {
      label: 'Rejected Applications',
      icon: ClipboardDocumentListIcon,
      value: stats?.tutor_applications?.rejected,
      color: 'text-danger-600',
    },
  ]

  const SESSION_STATS = [
    {
      label: 'Total Sessions',
      icon: CalendarDaysIcon,
      value: stats?.sessions?.total,
      color: 'text-ink-secondary',
    },
    {
      label: 'Scheduled Sessions',
      icon: CalendarDaysIcon,
      value: stats?.sessions?.scheduled,
      color: 'text-brand',
    },
    {
      label: 'Completed Sessions',
      icon: StarIcon,
      value: stats?.sessions?.completed,
      color: 'text-success-600',
    },
    {
      label: 'Cancelled Sessions',
      icon: CalendarDaysIcon,
      value: stats?.sessions?.cancelled,
      color: 'text-danger-600',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-8 px-4 max-w-7xl mx-auto">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="alert-error">{error}</div>
  }

  return (
    <div className="space-y-8 px-4 max-w-7xl mx-auto fade-in">
      <div>
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="body-text mt-1">System overview and key metrics.</p>
      </div>

      <StatGroup title="Users" stats={USER_STATS} />
      <StatGroup title="Tutor Applications" stats={APP_STATS} />
      <StatGroup title="Sessions" stats={SESSION_STATS} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section className="card p-6">
          <SectionHeader title="Recent Sessions" linkTo="/admin/sessions" />
          {recentSessions.length === 0 ? (
            <p className="text-ink-secondary text-sm italic">No recent sessions.</p>
          ) : (
            <ul className="space-y-4 max-h-64 overflow-y-auto">
              {recentSessions.map((s) => (
                <li key={s.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ink">{s.subject}</p>
                    <p className="caption-text">
                      {s.session_date} {s.start_time}
                    </p>
                  </div>
                  <Badge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <SectionHeader title="Recent Requests" linkTo="/admin/applications" />
          {recentRequests.length === 0 ? (
            <p className="text-ink-secondary text-sm italic">No recent requests.</p>
          ) : (
            <ul className="space-y-4 max-h-64 overflow-y-auto">
              {recentRequests.map((r) => (
                <li key={r.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ink">{r.subject}</p>
                    <p className="caption-text">
                      {r.preferred_date} {r.preferred_time}
                    </p>
                  </div>
                  <Badge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard