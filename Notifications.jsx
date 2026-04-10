import { useState, useEffect } from 'react'
import api from '../api/axios'
import { formatDateTime } from '../utils/roleUtils'
import { PageHeader, Badge, Button, EmptyState } from '../components/ui'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/solid'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      setError('')
      try {
        const url = filter ? `/notifications/?is_read=${filter === 'unread' ? 'false' : 'true'}` : '/notifications/'
        const res = await api.get(url)
        setNotifications(res.data.data || [])
      } catch {
        setError('Failed to load notifications.')
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [filter])

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch {
      setError('Failed to mark notification as read.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications((prev) => prev.filter(n => n.id !== id))
      setSuccess('Notification deleted.')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to delete notification.')
    }
  }

  const FILTERS = [
    { value: '', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 fade-in space-y-6">
      <PageHeader title="Notifications" subtitle="Stay updated with system alerts and messages." />

      <div className="flex gap-4">
        {FILTERS.map(f => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'primary' : 'secondary'}
            onClick={() => setFilter(f.value)}
            size="sm"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon=""
          title="No notifications"
          body="You are all caught up!"
        />
      ) : (
        <div className="space-y-4">
          {notifications.map(n => (
            <div key={n.id} className={`card-sm flex justify-between items-start ${n.is_read ? '' : 'bg-surface-low'}`}>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.is_read ? 'text-ink-secondary' : 'text-ink'}`}>
                  {n.title}
                </p>
                <p className="caption-text mt-1">
                  {n.message}
                </p>
                <p className="caption-text text-ink-secondary mt-1 text-xs">
                  {formatDateTime(n.created_at)}
                </p>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                {!n.is_read && (
                  <Button size="xs" variant="success" onClick={() => handleMarkRead(n.id)} title="Mark as read"><CheckIcon className="w-4 h-4" /></Button>
                )}
                <Button size="xs" variant="danger" onClick={() => handleDelete(n.id)} title="Delete"><XMarkIcon className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications