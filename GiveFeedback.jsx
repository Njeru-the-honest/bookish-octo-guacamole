import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { PageHeader, Button, EmptyState, Card, Modal, Badge } from '../../components/ui'

function StarRatingInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition ${
            star <= value ? 'text-warning-500' : 'text-surface-high'
          }`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function FeedbackModal({ session, onClose, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!rating) {
      setError('Please select a rating.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/feedback/', {
        session_id: session.id,
        rating,
        comment: comment.trim() || null,
      })

      setSuccess('Feedback submitted successfully.')

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit feedback.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Leave Feedback - ${session.subject}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div className="rounded-xl bg-surface-low p-4 space-y-1">
          <p className="text-sm font-semibold text-ink">{session.subject}</p>
          <p className="caption-text">
            {session.session_date} at {session.start_time}
            {session.end_time && ` – ${session.end_time}`}
          </p>
          {session.duration_minutes ? (
            <p className="caption-text">{session.duration_minutes} minutes</p>
          ) : null}
        </div>

        <div>
          <label className="input-label mb-2 block">Rating</label>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="input-label" htmlFor="feedback-comment">
            Comment (optional)
          </label>
          <textarea
            id="feedback-comment"
            rows={5}
            className="input-field resize-none"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe your experience with the tutor."
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Submit Feedback
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function SessionFeedbackCard({ session, onOpen }) {
  return (
    <Card className="hover:shadow-tonal-lg">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-display font-semibold text-ink">{session.subject}</h3>
            <Badge status={session.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
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
        </div>

        <Button type="button" variant="primary" onClick={() => onOpen(session)}>
          Leave Feedback
        </Button>
      </div>
    </Card>
  )
}

function GiveFeedback() {
  const [sessions, setSessions] = useState([])
  const [feedbackMap, setFeedbackMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSession, setSelectedSession] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchCompletedSessions = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await api.get('/sessions/my?status=completed')
      const completedSessions = res.data.data || []
      setSessions(completedSessions)

      const feedbackChecks = await Promise.all(
        completedSessions.map(async (session) => {
          try {
            const feedbackRes = await api.get(`/feedback/session/${session.id}`)
            return { sessionId: session.id, hasFeedback: !!feedbackRes.data.data }
          } catch (err) {
            if (err.response?.status === 404) {
              return { sessionId: session.id, hasFeedback: false }
            }
            return { sessionId: session.id, hasFeedback: false }
          }
        })
      )

      const map = {}
      feedbackChecks.forEach((item) => {
        map[item.sessionId] = item.hasFeedback
      })
      setFeedbackMap(map)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load completed sessions.')
      setSessions([])
      setFeedbackMap({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompletedSessions()
  }, [refreshKey])

  const pendingFeedbackSessions = useMemo(() => {
    return sessions.filter((session) => !feedbackMap[session.id])
  }, [sessions, feedbackMap])

  const handleFeedbackSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 fade-in">
      <PageHeader
        title="Give Feedback"
        subtitle="Rate completed tutoring sessions and help improve tutor quality."
      />

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : pendingFeedbackSessions.length === 0 ? (
        <EmptyState
          icon=""
          title="No feedback pending"
          body="You have no completed sessions waiting for feedback."
        />
      ) : (
        <div className="space-y-3">
          {pendingFeedbackSessions.map((session) => (
            <SessionFeedbackCard
              key={session.id}
              session={session}
              onOpen={setSelectedSession}
            />
          ))}
        </div>
      )}

      {selectedSession && (
        <FeedbackModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  )
}

export default GiveFeedback