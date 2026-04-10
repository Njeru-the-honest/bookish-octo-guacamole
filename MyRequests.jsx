import { useState, useEffect } from 'react'
import api from '../../api/axios'
import {
  formatStatus,
  getStatusBadgeClass,
  formatDateTime,
} from '../../utils/roleUtils'

function MyRequests() {
  const [requests,      setRequests]      = useState([])
  const [filter,        setFilter]        = useState('')
  const [loading,       setLoading]       = useState(true)
  const [cancelLoading, setCancelLoading] = useState('')
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')

  const fetchRequests = async (status) => {
    setLoading(true)
    setError('')
    try {
      const url = status
        ? `/requests/my?status=${status}`
        : '/requests/my'
      const res = await api.get(url)
      setRequests(res.data.data || [])
    } catch {
      setError('Failed to load requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests(filter)
  }, [filter])

  const handleCancel = async (requestId) => {
    if (!window.confirm('Cancel this tutoring request?')) return
    setCancelLoading(requestId)
    setError('')
    setSuccess('')
    try {
      await api.patch(`/requests/${requestId}/cancel`)
      setSuccess('Request cancelled successfully.')
      fetchRequests(filter)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Failed to cancel request.'
      )
    } finally {
      setCancelLoading('')
    }
  }

  const FILTERS = ['', 'pending', 'accepted', 'rejected', 'cancelled']

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="page-header">
        <h2 className="page-title">My Requests</h2>
        <p className="body-text mt-1">
          Track all your tutoring requests.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={filter === s
              ? 'filter-tab-active'
              : 'filter-tab'
            }
          >
            {s === '' ? 'All' : formatStatus(s)}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error   && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-icon">📋</p>
          <p className="empty-state-title">No requests found</p>
          <p className="empty-state-body">
            {filter
              ? `No ${formatStatus(filter)} requests yet.`
              : 'You have not sent any tutoring requests yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card-sm fade-in">
              <div className="flex items-start justify-between
                              gap-4 flex-wrap">
                <div className="flex-1 min-w-0">

                  {/* Subject + status */}
                  <div className="flex items-center gap-2
                                  mb-2 flex-wrap">
                    <h4 className="font-display font-700
                                   text-ink text-sm">
                      {req.subject}
                    </h4>
                    <span className={getStatusBadgeClass(req.status)}>
                      {formatStatus(req.status)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-x-6
                                  gap-y-1 mb-2">
                    <p className="caption-text">
                      <span className="font-600 text-ink-secondary">
                        Date:{' '}
                      </span>
                      {req.preferred_date}
                    </p>
                    <p className="caption-text">
                      <span className="font-600 text-ink-secondary">
                        Time:{' '}
                      </span>
                      {req.preferred_time}
                    </p>
                  </div>

                  {/* Notes */}
                  {req.notes && (
                    <p className="caption-text italic mb-2">
                      "{req.notes}"
                    </p>
                  )}

                  <p className="caption-text">
                    Submitted: {formatDateTime(req.created_at)}
                  </p>
                </div>

                {/* Cancel button */}
                {req.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={cancelLoading === req.id}
                    className="btn-danger text-xs px-3 py-1.5
                               flex-shrink-0"
                  >
                    {cancelLoading === req.id
                      ? 'Cancelling...'
                      : 'Cancel'
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyRequests