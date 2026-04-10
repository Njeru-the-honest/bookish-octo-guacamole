import { useState, useEffect, useMemo } from 'react'
import api from '../../api/axios'
import { Badge, Button, Card, EmptyState, PageHeader, Modal } from '../../components/ui'
import { StarIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/solid'

function RequestForm({ tutor, onClose, onSuccess }) {
  const [subject, setSubject] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submitRequest = async (e) => {
    e.preventDefault()

    if (!subject.trim() || !preferredDate || !preferredTime) {
      setError('Subject, preferred date, and preferred time are required.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/requests/', {
        tutor_id: tutor.user_id, // ✅ important fix
        subject: subject.trim(),
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        notes: notes.trim() || null,
      })

      setSuccess('Tutoring request submitted successfully.')

      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submitRequest} className="space-y-5">
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="rounded-xl bg-surface-low p-4">
        <p className="text-sm font-semibold text-ink">{tutor.full_name}</p>
        <p className="caption-text">{tutor.school_or_department}</p>
      </div>

      <div>
        <label className="input-label" htmlFor="request-subject">
          Subject
        </label>
        <input
          id="request-subject"
          type="text"
          className="input-field"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Calculus, Data Structures, Economics"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label" htmlFor="request-date">
            Preferred Date
          </label>
          <input
            id="request-date"
            type="date"
            className="input-field"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
        </div>

        <div>
          <label className="input-label" htmlFor="request-time">
            Preferred Time
          </label>
          <input
            id="request-time"
            type="time"
            className="input-field"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="input-label" htmlFor="request-notes">
          Notes (optional)
        </label>
        <textarea
          id="request-notes"
          rows={4}
          className="input-field resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any details that would help the tutor prepare."
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          Send Request
        </Button>
      </div>
    </form>
  )
}

function TutorCard({ tutor, onRequest }) {
  return (
    <Card className="hover:shadow-tonal-lg">
      <div className="relative h-48 rounded-xl bg-surface-lowest overflow-hidden">
        {tutor.avatar_url ? (
          <img
            src={tutor.avatar_url}
            alt={`Avatar of ${tutor.full_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserCircleIcon className="w-full h-full text-surface-low p-6" />
        )}
      </div>

      <div>
        <h3 className="font-display font-semibold text-ink mt-4 truncate">
          {tutor.full_name}
        </h3>
        <p className="caption-text text-ink-secondary truncate">
          {tutor.school_or_department}
        </p>

        <div className="flex flex-wrap gap-2 mt-2">
          {(tutor.subjects || []).slice(0, 3).map((subject) => (
            <Badge key={subject} color="neutral" className="text-xs px-3 py-1 rounded-pill">
              {subject}
            </Badge>
          ))}
          {(tutor.subjects || []).length > 3 && (
            <Badge color="neutral" className="text-xs px-3 py-1 rounded-pill">
              +{tutor.subjects.length - 3} more
            </Badge>
          )}
        </div>

        <p className="body-text text-ink-secondary mt-2 line-clamp-2">
          {tutor.bio || 'No bio provided.'}
        </p>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-1">
            <StarIcon className="w-5 h-5 text-warning-500" />
            <span className="caption-text font-semibold">
              {(tutor.average_rating ?? 0).toFixed(1)} / 5
            </span>
            <span className="caption-text text-ink-tertiary">
              ({tutor.total_reviews ?? 0})
            </span>
          </div>

          <Badge color="neutral">Approved Tutor</Badge>
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full mt-6 py-3"
        type="button"
        onClick={() => onRequest(tutor)}
      >
        Request Session
      </Button>
    </Card>
  )
}

function BrowseTutors() {
  const [tutors, setTutors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTutor, setSelectedTutor] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchTutors = async (subject = '') => {
    setLoading(true)
    setError('')

    try {
      let url = '/tutors/approved'
      if (subject) {
        url += `?subject=${encodeURIComponent(subject)}`
      }

      const res = await api.get(url)
      setTutors(res.data.data || [])
    } catch {
      setError('Failed to load tutors.')
      setTutors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTutors(selectedSubject)
  }, [selectedSubject, refreshKey])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
  }

  const clearSearch = () => {
    setSearch('')
    setSelectedSubject('')
  }

  const requestSession = (tutor) => {
    setSelectedTutor(tutor)
  }

  const closeModal = () => {
    setSelectedTutor(null)
  }

  const handleRequestSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const filteredTutors = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tutors

    return tutors.filter((tutor) => {
      const fullName = tutor.full_name?.toLowerCase() || ''
      const bio = tutor.bio?.toLowerCase() || ''
      const department = tutor.school_or_department?.toLowerCase() || ''
      const subjects = (tutor.subjects || []).join(' ').toLowerCase()

      return (
        fullName.includes(query) ||
        bio.includes(query) ||
        department.includes(query) ||
        subjects.includes(query)
      )
    })
  }, [tutors, search])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <PageHeader
        title="Find Your Academic Mentor"
        subtitle="Connect with experienced USIU-Africa tutors for personalized learning sessions tailored to your degree path."
      />

      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 mb-8 max-w-4xl">
        <div className="relative flex-grow">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary w-5 h-5" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12 pr-4"
            placeholder="Search by tutor name, subject, or keyword..."
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">All Subjects</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Economics">Economics</option>
        </select>

        <Button variant="primary" type="submit" className="min-w-[140px]">
          Search
        </Button>

        {(search || selectedSubject) && (
          <Button
            variant="secondary"
            type="button"
            onClick={clearSearch}
            className="min-w-[140px]"
          >
            Clear Search
          </Button>
        )}
      </form>

      {error && <div className="alert-error max-w-4xl">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-[370px] rounded-xl" />
          ))}
        </div>
      ) : filteredTutors.length === 0 ? (
        <EmptyState
          icon=""
          title={search ? `No tutors found for "${search}"` : 'No approved tutors available'}
          body={
            search
              ? 'Try a different subject or clear the search.'
              : 'Tutors will appear here once approved by an administrator.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} onRequest={requestSession} />
          ))}
        </div>
      )}

      {selectedTutor && (
        <Modal
          open
          onClose={closeModal}
          title={`Request Session with ${selectedTutor.full_name}`}
        >
          <RequestForm
            tutor={selectedTutor}
            onClose={closeModal}
            onSuccess={handleRequestSuccess}
          />
        </Modal>
      )}
    </div>
  )
}

export default BrowseTutors