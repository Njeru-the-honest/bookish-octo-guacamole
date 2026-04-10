import { useState, useEffect, useMemo } from 'react'
import api from '../../api/axios'
import {
  formatStatus,
  formatDateTime,
} from '../../utils/roleUtils'
import {
  PageHeader,
  Badge,
  EmptyState,
  FilterTabs,
  Card,
} from '../../components/ui'

const FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function MySessions() {
  const [sessions, setSessions] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})
  const [feedbackMap, setFeedbackMap] = useState({})
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSessions = async (status = '') => {
    setLoading(true)
    setError('')

    try {
      const url = status ? `/sessions/my?status=${status}` : '/sessions/my'
      const res = await api.get(url)
      const sessionRows = res.data.data || []
      setSessions(sessionRows)

      const attendanceResults = await Promise.allSettled(
        sessionRows.map((session) => api.get(`/attendance/${session.id}`))
      )

      const nextAttendanceMap = {}
      attendanceResults.forEach((result, index) => {
        const sessionId = sessionRows[index]?.id
        if (!sessionId) return

        if (result.status === 'fulfilled') {
          nextAttendanceMap[sessionId] = result.value.data?.data || null
        } else {
          nextAttendanceMap[sessionId] = null
        }
      })
      setAttendanceMap(nextAttendanceMap)

      const feedbackResults = await Promise.allSettled(
        sessionRows.map((session) => api.get(`/feedback/session/${session.id}`))
      )

      const nextFeedbackMap = {}
      feedbackResults.forEach((result, index) => {
        const sessionId = sessionRows[index]?.id
        if (!sessionId) return

        if (result.status === 'fulfilled') {
          nextFeedbackMap[sessionId] = result.value.data?.data || null
        } else {
          nextFeedbackMap[sessionId] = null
        }
      })
      setFeedbackMap(nextFeedbackMap)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load sessions.')
      setSessions([])
      setAttendanceMap({})
      setFeedbackMap({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions(filter)
  }, [filter])

  const visibleSessions = useMemo(() => sessions, [sessions])

  const getAttendanceLabel = (attendance) => {
    if (!attendance) return 'Not recorded'
    return formatStatus(attendance.student_attendance)
  }

  const getFeedbackLabel = (session) => {
    if (session.status !== 'completed') return 'Not available yet'
    return feedbackMap[session.id] ? 'Submitted' : 'Pending'
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 fade-in">
      <PageHeader
        title="My Sessions"
        subtitle="View your scheduled, active, and past tutoring sessions."
      />

      <FilterTabs
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
      />

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : visibleSessions.length === 0 ? (
        <EmptyState
          icon=""
          title="No sessions found"
          body={
            filter
              ? `No ${formatStatus(filter)} sessions yet.`
              : 'Sessions will appear here once a tutor schedules one for you.'
          }
        />
      ) : (
        <div className="space-y-3">
          {visibleSessions.map((session) => {
            const attendance = attendanceMap[session.id]
            const feedback = feedbackMap[session.id]

            return (
              <Card key={session.id} className="fade-in">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-display font-semibold text-ink text-sm">
                        {session.subject}
                      </h4>
                      <Badge status={session.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mb-3">
                      <p className="caption-text">
                        <span className="font-semibold text-ink-secondary">Date: </span>
                        {session.session_date}
                      </p>
                      <p className="caption-text">
                        <span className="font-semibold text-ink-secondary">Time: </span>
                        {session.start_time}
                        {session.end_time && ` – ${session.end_time}`}
                      </p>
                      <p className="caption-text">
                        <span className="font-semibold text-ink-secondary">Duration: </span>
                        {session.duration_minutes ? `${session.duration_minutes} min` : '—'}
                      </p>
                      <p className="caption-text">
                        <span className="font-semibold text-ink-secondary">Created: </span>
                        {formatDateTime(session.created_at)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      <p className="caption-text">
                        <span className="font-semibold text-ink-secondary">Attendance: </span>
                        {getAttendanceLabel(attendance)}
                      </p>
                      <p className="caption-text">
                        <span className="font-semibold text-ink-secondary">Feedback: </span>
                        {getFeedbackLabel(session)}
                      </p>
                    </div>

                    {feedback && (
                      <div className="mt-3 rounded-xl bg-surface-low p-3">
                        <p className="caption-text">
                          <span className="font-semibold text-ink-secondary">Your Rating: </span>
                          {feedback.rating}/5
                        </p>
                        {feedback.comment && (
                          <p className="caption-text italic mt-1">"{feedback.comment}"</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MySessions