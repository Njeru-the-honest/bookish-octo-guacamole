import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { renderStars, formatDateTime } from '../../utils/roleUtils'

const COMMON_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'Statistics', 'Economics',
  'Accounting', 'Business Studies', 'English',
  'History', 'Geography', 'Psychology', 'Sociology',
  'Law', 'Finance', 'Marketing', 'Engineering',
  'Architecture', 'Nursing',
]

// ─── Subject selector ─────────────────────────────────────────────────────────
function SubjectSelector({ selected, onChange }) {
  const [input, setInput] = useState('')

  const addSubject = (subject) => {
    const trimmed = subject.trim()
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed])
    }
    setInput('')
  }

  const removeSubject = (subject) => {
    onChange(selected.filter((s) => s !== subject))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (input.trim()) addSubject(input)
    }
  }

  return (
    <div className="space-y-3">

      {/* Selected pills */}
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {selected.length === 0 ? (
          <p className="caption-text">No subjects selected yet.</p>
        ) : (
          selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 px-2.5 py-1
                         rounded-pill text-xs font-600
                         bg-brand-100 text-brand-700"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSubject(s)}
                className="text-brand-500 hover:text-brand-800
                           font-700 leading-none ml-0.5"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input-field flex-1"
          placeholder="Type a subject and press Enter..."
        />
        <button
          type="button"
          onClick={() => input.trim() && addSubject(input)}
          className="btn-secondary px-4"
        >
          Add
        </button>
      </div>

      {/* Quick-add suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {COMMON_SUBJECTS
          .filter((s) => !selected.includes(s))
          .slice(0, 10)
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSubject(s)}
              className="px-2.5 py-1 text-xs rounded-pill
                         bg-surface-low text-ink-tertiary
                         hover:bg-brand-50 hover:text-brand-700
                         transition-colors duration-150 font-500"
            >
              + {s}
            </button>
          ))
        }
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
function TutorProfile() {
  const { user, refreshUser } = useAuth()

  const [profile,  setProfile]  = useState(null)
  const [feedback, setFeedback] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const [formData, setFormData] = useState({
    bio:          '',
    availability: '',
    subjects:     [],
  })

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const [profileRes, feedbackRes] = await Promise.all([
        api.get('/tutors/profile/me'),
        api.get('/feedback/my'),
      ])
      const p = profileRes.data.data
      setProfile(p)
      setFeedback(feedbackRes.data.data || [])
      setFormData({
        bio:          p?.bio          || '',
        availability: p?.availability || '',
        subjects:     p?.subjects     || [],
      })
    } catch {
      setError('Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (formData.subjects.length === 0) {
      setError('Please add at least one subject.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/tutors/profile/me', formData)
      setSuccess('Profile updated successfully.')
      setEditMode(false)
      fetchProfile()
      await refreshUser()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Failed to update profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="page-header-inner">
        <div>
          <h2 className="page-title">My Profile</h2>
          <p className="body-text mt-1">
            Manage your tutor profile and subjects.
          </p>
        </div>
        {!editMode && (
          <button
                        onClick={() => setEditMode(true)}
            className="btn-secondary"
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {/* Messages */}
      {error   && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {/* Profile card */}
      <div className="card">

        {/* Avatar + name + rating */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl flex items-center
                          justify-center text-white font-display
                          font-700 text-xl flex-shrink-0"
               style={{
                 background:
                   'linear-gradient(135deg, #003366 0%, #001e40 100%)',
               }}>
            {user?.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-700 text-ink text-lg
                           leading-tight">
              {user?.full_name}
            </h3>
            <p className="caption-text mt-0.5">
              {user?.school_or_department}
            </p>
            <p className="caption-text">{user?.email}</p>
            {profile?.total_reviews > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-yellow-400">
                  {renderStars(Math.round(profile.average_rating))}
                </span>
                <span className="caption-text">
                  {profile.average_rating?.toFixed(1)} / 5
                  {' '}({profile.total_reviews} review
                  {profile.total_reviews !== 1 ? 's' : ''})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View mode */}
        {!editMode ? (
          <div className="space-y-5">

            <div>
              <p className="label-text mb-2">Subjects</p>
              <div className="flex flex-wrap gap-2">
                {profile?.subjects?.length > 0
                  ? profile.subjects.map((s) => (
                      <span key={s} className="subject-pill">
                        {s}
                      </span>
                    ))
                  : <p className="caption-text">
                      No subjects listed.
                    </p>
                }
              </div>
            </div>

            <div>
              <p className="label-text mb-1">Bio</p>
              <p className="body-text">
                {profile?.bio || 'No bio added yet.'}
              </p>
            </div>

            <div>
              <p className="label-text mb-1">Availability</p>
              <p className="body-text">
                {profile?.availability || 'Not specified.'}
              </p>
            </div>

          </div>

        ) : (
          /* Edit mode */
          <form onSubmit={handleSave} className="space-y-5">

            <div className="input-group">
              <label className="input-label">Subjects</label>
              <SubjectSelector
                selected={formData.subjects}
                onChange={(subjects) =>
                  setFormData({ ...formData, subjects })
                }
              />
            </div>

            <div className="input-group">
              <label className="input-label">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input-field resize-none"
                rows={4}
                placeholder="Tell students about your background
                             and teaching style..."
              />
            </div>

            <div className="input-group">
              <label className="input-label">Availability</label>
              <input
                type="text"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Weekdays 4pm–7pm, Saturdays 9am–1pm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false)
                  setError('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Feedback received */}
      <div>
        <h3 className="section-title mb-4">
          ⭐ Feedback Received
        </h3>
        {feedback.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-icon">⭐</p>
            <p className="empty-state-title">No feedback yet</p>
            <p className="empty-state-body">
              Student feedback will appear here after sessions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedback.map((fb) => (
              <div key={fb.id} className="card-sm">
                <div className="flex items-start
                                justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-400">
                        {'★'.repeat(fb.rating)}
                        <span className="star-empty">
                          {'★'.repeat(5 - fb.rating)}
                        </span>
                      </span>
                      <span className="text-sm font-600
                                       text-ink-secondary">
                        {fb.rating} / 5
                      </span>
                    </div>
                    {fb.comment && (
                      <p className="body-text italic">
                        "{fb.comment}"
                      </p>
                    )}
                  </div>
                  <p className="caption-text flex-shrink-0">
                    {formatDateTime(fb.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default TutorProfile