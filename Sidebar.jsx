import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import {
  HomeIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  StarIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const ROLE_LABEL = {
  student: 'Student Portal',
  tutor: 'Tutor Portal',
  admin: 'Admin Portal',
}

const ROLE_ACCENT = {
  student: 'from-brand-500 to-brand-700',
  tutor: 'from-success-500 to-success-700',
  admin: 'from-warning-500 to-warning-700',
}

const NAV = {
  student: [
    { to: '/student/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/student/tutors', icon: <BookOpenIcon className="w-5 h-5" />, label: 'Browse Tutors' },
    { to: '/student/requests', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, label: 'My Requests' },
    { to: '/student/sessions', icon: <CalendarIcon className="w-5 h-5" />, label: 'My Sessions' },
    { to: '/student/feedback', icon: <StarIcon className="w-5 h-5" />, label: 'Feedback' },
  ],
  tutor: [
    { to: '/tutor/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/tutor/requests', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, label: 'Requests' },
    { to: '/tutor/sessions', icon: <CalendarIcon className="w-5 h-5" />, label: 'Sessions' },
    { to: '/tutor/profile', icon: <UserGroupIcon className="w-5 h-5" />, label: 'My Profile' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/admin/applications', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, label: 'Applications' },
    { to: '/admin/users', icon: <UserGroupIcon className="w-5 h-5" />, label: 'Users' },
    { to: '/admin/sessions', icon: <CalendarIcon className="w-5 h-5" />, label: 'Sessions' },
    { to: '/admin/reports', icon: <StarIcon className="w-5 h-5" />, label: 'Reports' },
  ],
}

const GENERAL_NAV = [
  { to: '/notifications', icon: <BellIcon className="w-5 h-5" />, label: 'Notifications' },
  { to: '/settings', icon: <Cog6ToothIcon className="w-5 h-5" />, label: 'Settings' },
]

function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = NAV[user?.role] || []
  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="sidebar-root">
      <div className="sidebar-logo">
        <div
          className={`sidebar-logo-mark bg-gradient-to-br ${
            ROLE_ACCENT[user?.role] || 'from-brand-500 to-brand-700'
          }`}
        >
          U
        </div>
        <div className="min-w-0">
          <p className="sidebar-logo-text truncate">USIU Tutoring</p>
          <p className="sidebar-logo-sub truncate">{ROLE_LABEL[user?.role] || 'Portal'}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label mb-3">Navigation</p>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) => (isActive ? 'sidebar-item-active' : 'sidebar-item')}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}

        <p className="sidebar-section-label mt-6 mb-3">General</p>

        {GENERAL_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) => (isActive ? 'sidebar-item-active' : 'sidebar-item')}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user mb-1">
          <div
            className={`sidebar-avatar bg-gradient-to-br ${
              ROLE_ACCENT[user?.role] || 'from-brand-500 to-brand-700'
            }`}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="sidebar-user-name">{user?.full_name}</p>
            <p className="sidebar-user-role">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="sidebar-item w-full mt-1"
          style={{ color: 'rgba(255,255,255,0.45)' }}
          type="button"
        >
          <span className="sidebar-item-icon">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="hidden lg:block">{sidebarContent}</div>

      {mobileOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-30 bg-black bg-opacity-25" onClick={onMobileClose} />
          <div className="fixed top-0 left-0 z-40 h-full slide-up">{sidebarContent}</div>
        </div>
      )}
    </>
  )
}

export default Sidebar