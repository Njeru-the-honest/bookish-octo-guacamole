import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { formatStatus, formatDateTime } from '../../utils/roleUtils'
import {
  PageHeader,
  Badge,
  Button,
  EmptyState,
  FilterTabs,
  Modal,
} from '../../components/ui'

const FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function CreateSessionModal({ request, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    session_date: request.preferred_date || '',
    start_time: request.preferred_time || '',
    end_time: '',
    duration_minutes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/sessions/', {
        tutoring_request_id: request.id,
        session_date: formData.session_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        duration_minutes: formData.duration_minutes
          ? parseInt(formData.duration_minutes, 10)
          : null,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create session.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Schedule Session - ${request.subject}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="alert-error">{error}</div>}

        <div className="rounded-xl bg-surface-low p-4 space-y-1">
          <p className="text-sm font-semibold text-ink">{request.subject}</p>
          <p className="caption-text">
            Preferred: {request.preferred_date} at {request.preferred_time}
          </p>
        </div>

        <div>
          <label className="input-label" htmlFor="session_date">
            Session Date
          </label>
          <input
            id="session_date"
            type="date"
            name="session_date"
            value={formData.session_date}
            onChange={handleChange}
            className="input-field"
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label" htmlFor="start_time">
              Start Time
            </label>
            <input
              id="start_time"
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label" htmlFor="end_time">
              End Time <span className="text-ink-disabled font-normal">(optional)</span>
            </label>
            <input
              id="end_time"
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor="duration_minutes">
            Duration (minutes) <span className="text-ink-disabled font-normal">(optional)</span>
          </label>
          <input
            id="duration_minutes"
            type="number"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g. 60"
            min="15"
            max="480"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Schedule Session
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function UpdateStatusModal({ session, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allowedTransitions = {
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
  }

  const transitions = allowedTransitions[session.status] || []

  const handleUpdate = async (newStatus) => {
    setLoading(true)
    setError('')

    try {
      await api.patch(`/sessions/${session.id}/status`, {
        status: newStatus,
      })
      onSuccess(newStatus)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update session status.')
    } finally {
      setLoading(false)
    }
  }

  const transitionLabels = {
    in_progress: 'Start Session',
    completed: 'Mark Completed',
    cancelled: 'Cancel Session',
  }

  const transitionVariants = {
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'danger',
  }

  return (
    <Modal open onClose={onClose} title={`Update Session - ${session.subject}`}>
      <div className="space-y-5">
        {error && <div className="alert-error">{error}</div>}

        <div className="rounded-xl bg-surface-low p-4">
          <p className="caption-text mb-1">Current status</p>
          <Badge status={session.status} />
        </div>

        <div className="space-y-3">
          <p className="label-text">Select new status</p>

          {transitions.map((transition) => (
            <Button
              key={transition}
              type="button"
              variant={transitionVariants[transition]}
              className="w-full"
              loading={loading}
              disabled={loading}
              onClick={() => handleUpdate(transition)}
            >
              {transitionLabels[transition]}
            </Button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AttendanceModal({ session, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    tutor_attendance: 'present',
    student_attendance: 'present',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attendanceExists, setAttendanceExists] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    const initializeAttendance = async () => {
      setBootstrapping(true)
      setError('')

      try {
        const existing = await api.get(`/attendance/${session.id}`)
        const record = existing.data.data

        setAttendanceExists(true)
        setFormData({
          tutor_attendance: record.tutor_attendance || 'present',
          student_attendance: record.student_attendance || 'pending',
          notes: record.notes || '',
        })
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            await api.post(`/attendance/${session.id}`, {
              notes: '',
            })
            setAttendanceExists(true)
          } catch (createErr) {
            setError(createErr.response?.data?.detail || 'Failed to initialize attendance.')
          }
        } else {
          setError(err.response?.data?.detail || 'Failed to load attendance.')
        }
      } finally {
        setBootstrapping(false)
      }
    }

    initializeAttendance()
  }, [session.id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.patch(`/attendance/${session.id}`, {
        tutor_attendance: formData.tutor_attendance,
        student_attendance: formData.student_attendance,
        notes: formData.notes.trim() || null,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record attendance.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Record Attendance - ${session.subject}`}>
      {bootstrapping ? (
        <div className="space-y-3">
          <div className="skeleton h-10 rounded-xl" />
          <div className="skeleton h-10 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="alert-error">{error}</div>}

          <div className="rounded-xl bg-surface-low p-4 space-y-1">
            <p className="text-sm font-semibold text-ink">{session.subject}</p>
            <p className="caption-text">
              {session.session_date} at {session.start_time}
            </p>
            {attendanceExists && (
              <p className="caption-text text-success-700">Attendance record ready</p>
            )}
          </div>

          <div>
            <label className="input-label" htmlFor="tutor_attendance">
              Tutor Attendance
            </label>
            <select
              id="tutor_attendance"
              name="tutor_attendance"
              value={formData.tutor_attendance}
              onChange={handleChange}
              className="input-field"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>

          <div>
            <label className="input-label" htmlFor="student_attendance">
              Student Attendance
            </label>
            <select
              id="student_attendance"
              name="student_attendance"
              value={formData.student_attendance}
              onChange={handleChange}
              className="input-field"
            >
              <option value="pending">Pending</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>

          <div>
            <label className="input-label" htmlFor="attendance_notes">
              Notes (optional)
            </label>
            <textarea
              id="attendance_notes"
              name="notes"
              rows={4}
              className="input-field resize-none"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any attendance or participation notes."
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Save Attendance
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function TutorSessions() {
  const [sessions, setSessions] = useState([])
  const [acceptedReqs, setAcceptedReqs] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createModal, setCreateModal] = useState(null)
  const [updateModal, setUpdateModal] = useState(null)
  const [attendanceModal, setAttendanceModal] = useState(null)

  const fetchData = async (status) => {
    setLoading(true)
    setError('')

    try {
      const url = status ? `/sessions/my?status=${status}` : '/sessions/my'
      const [sesRes, reqRes] = await Promise.all([
        api.get(url),
        api.get('/requests/incoming?status=accepted'),
      ])

      setSessions(sesRes.data.data || [])
      setAcceptedReqs(reqRes.data.data || [])
    } catch {
      setError('Failed to load sessions.')
      setSessions([])
      setAcceptedReqs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(filter)
  }, [filter])

  const requestsWithoutSession = acceptedReqs.filter(
    (req) => !sessions.some((s) => s.tutoring_request_id === req.id)
  )

  const handleCreateSuccess = () => {
    setCreateModal(null)
    setSuccess('Session scheduled successfully.')
    setTimeout(() => setSuccess(''), 4000)
    fetchData(filter)
  }

  const handleUpdateSuccess = (newStatus) => {
    setUpdateModal(null)
    setSuccess(`Session marked as ${formatStatus(newStatus)}.`)
    setTimeout(() => setSuccess(''), 4000)
    fetchData(filter)
  }

  const handleAttendanceSuccess = () => {
    setAttendanceModal(null)
    setSuccess('Attendance recorded successfully.')
    setTimeout(() => setSuccess(''), 4000)
    fetchData(filter)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 fade-in">
      <PageHeader
        title="My Sessions"
        subtitle="Schedule and manage your tutoring sessions."
      />

      {requestsWithoutSession.length > 0 && (
        <div
          className="rounded-xl p-5 fade-in"
          style={{
            background: 'rgba(245,158,11,0.06)',
            borderLeft: '3px solid #f59e0b',
          }}
        >
          <div className="mb-3">
            <h3 className="section-title text-warning-700">Ready to Schedule</h3>
            <p className="body-text text-warning-700 mt-1">
              {requestsWithoutSession.length} accepted request
              {requestsWithoutSession.length !== 1 ? 's' : ''} waiting to be scheduled.
            </p>
          </div>

          <div className="space-y-2">
            {requestsWithoutSession.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-surface-lowest rounded-lg p-3 gap-3 flex-wrap"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{req.subject}</p>
                  <p className="caption-text">
                    Preferred: {req.preferred_date} at {req.preferred_time}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setCreateModal(req)}
                >
                  Schedule
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <FilterTabs options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon=""
          title="No sessions found"
          body={
            filter
              ? `No ${formatStatus(filter)} sessions yet.`
              : 'Accept requests and schedule sessions to get started.'
          }
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="card-sm fade-in">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-display font-semibold text-ink text-sm">
                      {session.subject}
                    </h4>
                    <Badge status={session.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mb-2">
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
                  </div>

                  <p className="caption-text">
                    Created: {formatDateTime(session.created_at)}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {session.status === 'in_progress' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setAttendanceModal(session)}
                    >
                      Mark Attendance
                    </Button>
                  )}

                  {(session.status === 'scheduled' || session.status === 'in_progress') && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setUpdateModal(session)}
                    >
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createModal && (
        <CreateSessionModal
          request={createModal}
          onClose={() => setCreateModal(null)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {updateModal && (
        <UpdateStatusModal
          session={updateModal}
          onClose={() => setUpdateModal(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {attendanceModal && (
        <AttendanceModal
          session={attendanceModal}
          onClose={() => setAttendanceModal(null)}
          onSuccess={handleAttendanceSuccess}
        />
      )}
    </div>
  )
}

export default TutorSessions