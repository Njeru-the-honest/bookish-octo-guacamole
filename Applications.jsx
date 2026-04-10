import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { formatStatus, getStatusBadgeClass, formatDateTime } from '../../utils/roleUtils'
import { PageHeader, Badge, Button, EmptyState, Table, Modal, FilterTabs } from '../../components/ui'

function ReviewModal({ application, onClose, onSuccess }) {
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submitReview = async (e) => {
    e.preventDefault()
    if (!status) {
      setError('Please select a decision.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.patch(`/tutors/applications/${application.id}/review`, {
        status,
        review_notes: notes,
      })
      onSuccess()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to review application.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Review Application - ${application.full_name}`}>
      <form onSubmit={submitReview} className="space-y-4">

        {error && <div className="alert-error">{error}</div>}

        <div>
          <p className="label-text">Subjects</p>
          <div className="flex flex-wrap gap-2">
            {application.subjects.map((subject) => (
              <Badge key={subject} color="neutral">{subject}</Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="label-text">Bio</p>
          <p className="body-text">{application.bio}</p>
        </div>

        <div>
          <p className="label-text">Availability</p>
          <p className="body-text">{application.availability}</p>
        </div>

        <div>
          <p className="label-text">Decision</p>
          <div className="flex gap-4">
            <Button variant={status === 'approved' ? 'success' : 'secondary'} onClick={() => setStatus('approved')} type="button">
              Approve
            </Button>
            <Button variant={status === 'rejected' ? 'danger' : 'secondary'} onClick={() => setStatus('rejected')} type="button">
              Reject
            </Button>
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor="notes">Review Notes (optional)</label>
          <textarea
            id="notes"
            rows={3}
            className="input-field resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Submit
          </Button>
        </div>

      </form>
    </Modal>
  )
}

function Applications() {
  const [applications, setApplications] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedApp, setSelectedApp] = useState(null)

  useEffect(() => {
    fetchApplications()
  }, [filter])

  const fetchApplications = async () => {
    setLoading(true)
    setError('')
    try {
      const url = filter ? `/tutors/applications?status=${filter}` : '/tutors/applications'
      const res = await api.get(url)
      setApplications(res.data.data || [])
    } catch {
      setError('Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSuccess = () => {
    setSuccess('Application updated successfully')
    setSelectedApp(null)
    fetchApplications()
    setTimeout(() => setSuccess(''), 3000)
  }

  const columns = [
    {
      key: 'full_name',
      label: 'Applicant',
      render: app => (
        <div>
          <p className="font-display font-semibold text-ink">{app.full_name}</p>
          <p className="caption-text">{app.email}</p>
        </div>
      ),
    },
    {
      key: 'subjects',
      label: 'Subjects',
      render: app => app.subjects.join(', '),
    },
    {
      key: 'status',
      label: 'Status',
      render: app => <Badge status={app.status} />,
    },
    {
      key: 'created_at',
      label: 'Applied On',
      render: app => formatDateTime(app.created_at),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: app =>
        app.status === 'pending' ? (
          <Button variant="primary" size="sm" onClick={() => setSelectedApp(app)}>
            Review
          </Button>
        ) : (
          <span className="text-ink-secondary">{formatStatus(app.status)}</span>
        ),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 fade-in">

      <PageHeader
        title="Tutor Applications"
        subtitle="View and manage tutor applications."
      />

      <FilterTabs
        options={[
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: '', label: 'All' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon=""
          title="No applications found"
          body={`No ${filter || 'pending'} applications found.`}
        />
      ) : (
        <Table
          columns={columns}
          rows={applications}
          keyExtractor={app => app.id}
          renderCell={(app, col) => (col.render ? col.render(app) : app[col.key])}
        />
      )}

      {selectedApp && (
        <ReviewModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  )
}

export default Applications