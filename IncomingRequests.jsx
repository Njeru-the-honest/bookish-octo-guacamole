import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { formatStatus, formatDateTime } from '../../utils/roleUtils'
import { PageHeader, Badge, Button, EmptyState, FilterTabs } from '../../components/ui'

const FILTER_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' },
]

function IncomingRequests() {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchRequests = async (status = '') => {
    setLoading(true)
    setError('')

    try {
      const url = status ? `/requests/incoming?status=${status}` : '/requests/incoming'
      const res = await api.get(url)
      setRequests(res.data.data || [])
    } catch {
      setError('Failed to load requests.')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests(filter)
  }, [filter])

  const handleRespond = async (requestId, newStatus) => {
    const actionKey = `${requestId}-${newStatus}`
    setActionLoading(actionKey)
    setError('')
    setSuccess('')

    try {
      await api.patch(`/requests/${requestId}/respond`, {
        status: newStatus,
      })

      setSuccess(`Request ${formatStatus(newStatus)} successfully.`)
      await fetchRequests(filter)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update request.')
    } finally {
      setActionLoading('')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 fade-in">
      <PageHeader
        title="Incoming Requests"
        subtitle="Review and respond to student tutoring requests."
      />

      <FilterTabs
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
      />

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon=""
          title="No requests found"
          body={
            filter
              ? `No ${formatStatus(filter)} requests yet.`
              : 'No incoming requests at the moment.'
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card-sm fade-in">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-display font-700 text-ink text-sm">
                      {req.subject}
                    </h4>
                    <Badge status={req.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mb-2">
                    <p className="caption-text">
                      <span className="font-600 text-ink-secondary">Date: </span>
                      {req.preferred_date}
                    </p>
                    <p className="caption-text">
                      <span className="font-600 text-ink-secondary">Time: </span>
                      {req.preferred_time}
                    </p>
                  </div>

                  {req.notes && (
                    <p className="caption-text italic mb-2">"{req.notes}"</p>
                  )}

                  <p className="caption-text">
                    Received: {formatDateTime(req.created_at)}
                  </p>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="success"
                      size="sm"
                      type="button"
                      loading={actionLoading === `${req.id}-accepted`}
                      disabled={!!actionLoading}
                      onClick={() => handleRespond(req.id, 'accepted')}
                    >
                      Accept
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      type="button"
                      loading={actionLoading === `${req.id}-rejected`}
                      disabled={!!actionLoading}
                      onClick={() => handleRespond(req.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default IncomingRequests