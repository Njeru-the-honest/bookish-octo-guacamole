import { useState, useEffect } from 'react'
import api from '../../api/axios'
import {
  formatStatus,
  formatDateTime,
} from '../../utils/roleUtils'
import {
  Table,
  EmptyState,
  PageHeader,
  FilterTabs,
  Badge,
} from '../../components/ui'

const FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function AllSessions() {
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
      const url = status ? `/sessions/all?status=${status}` : '/sessions/all'
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
      setError(err.response?.data?.detail || 'Failed to fetch sessions.')
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

  const getAttendanceSummary = (row) => {
    const attendance = attendanceMap[row.id]
    if (!attendance) return 'Pending'

    const tutor = formatStatus(attendance.tutor_attendance)
    const student = formatStatus(attendance.student_attendance)
    return `Tutor: ${tutor}, Student: ${student}`
  }

  const getFeedbackSummary = (row) => {
    const feedback = feedbackMap[row.id]
    if (!feedback) return 'Not submitted'
    return `${feedback.rating}/5`
  }

  const columns = [
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => <span className="font-medium text-ink">{row.subject}</span>,
    },
    {
      key: 'session_date',
      label: 'Date',
      className: 'hidden md:table-cell',
    },
    {
      key: 'start_time',
      label: 'Time',
      className: 'hidden md:table-cell',
      render: (row) =>
        `${row.start_time}${row.end_time ? ` – ${row.end_time}` : ''}`,
    },
    {
      key: 'duration_minutes',
      label: 'Duration',
      className: 'hidden lg:table-cell',
      render: (row) => (row.duration_minutes ? `${row.duration_minutes} min` : '—'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'attendance',
      label: 'Attendance',
      className: 'hidden xl:table-cell',
      render: (row) => (
        <span className="caption-text">{getAttendanceSummary(row)}</span>
      ),
    },
    {
      key: 'feedback',
      label: 'Feedback',
      className: 'hidden lg:table-cell',
      render: (row) => (
        <span className="caption-text">{getFeedbackSummary(row)}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      className: 'hidden xl:table-cell',
      render: (row) => formatDateTime(row.created_at),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 fade-in">
      <PageHeader
        title="All Sessions"
        subtitle="Monitor tutoring sessions, attendance, and feedback across the system."
      />

      <FilterTabs
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
      />

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon=""
          title="No sessions found"
          body="No tutoring sessions match the current filters."
        />
      ) : (
        <Table
          columns={columns}
          rows={sessions}
          keyExtractor={(row) => row.id}
          renderCell={(row, col) => (col.render ? col.render(row) : row[col.key] ?? '—')}
        />
      )}
    </div>
  )
}

export default AllSessions