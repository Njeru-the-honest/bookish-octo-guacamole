import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Import icons from Heroicons
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

// Page titles mapped by route path
const PAGE_TITLES = {
  '/student/dashboard': 'Dashboard',
  '/student/tutors': 'Browse Tutors',
  '/student/requests': 'My Requests',
  '/student/sessions': 'My Sessions',
  '/student/feedback': 'Give Feedback',
  '/tutor/dashboard': 'Dashboard',
  '/tutor/requests': 'Incoming Requests',
  '/tutor/sessions': 'My Sessions',
  '/tutor/profile': 'My Profile',
  '/admin/dashboard': 'Dashboard',
  '/admin/applications': 'Applications',
  '/admin/users': 'User Management',
  '/admin/sessions': 'All Sessions',
  '/admin/reports': 'Reports',
  '/notifications': 'Notifications',
}

function Topbar({ onMobileMenuOpen }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  // Compute page title based on path
  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard'

  // Get initials for avatar
  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/v1/notifications/unread-count', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        })
        const data = await res.json()
        setUnreadCount(data.data.unread_count || 0)
      } catch {
        // Ignore errors to avoid UI disruption
      }
    }
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="topbar-root glass border-b border-gray-200">

      {/* Left side: menu toggle and page title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuOpen}
          className="topbar-icon-btn lg:hidden"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* Page title and date */}
        <div>
          <h1 className="font-display font-700 text-ink text-lg tracking-tight">
            {pageTitle}
          </h1>
          <p className="caption-text text-ink-secondary mt-0.5">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Right side: search, notifications, user avatar */}
      <div className="flex items-center gap-4">

        {/* Search input (readonly hint for now) */}
        <div className="topbar-search hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-low cursor-text text-ink-secondary">
          <MagnifyingGlassIcon className="w-5 h-5" />
          <span className="text-sm select-none">Search across the Atelier...</span>
        </div>

        {/* Notifications bell button */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative topbar-icon-btn"
          aria-label="View notifications"
        >
          <BellIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="topbar-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-surface-high hidden md:block" />

        {/* User avatar */}
        <div
          className="topbar-avatar cursor-pointer select-none"
          title={user?.full_name}
          onClick={() => navigate('/profile')}
        >
          {initials || 'US'}
        </div>
      </div>
    </header>
  )
}

export default Topbar