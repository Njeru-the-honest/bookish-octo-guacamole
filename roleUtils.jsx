// roleUtils.js
// Shared utility functions for role-based UI logic,
// status formatting, badge classes, and display helpers.

// ============================================================
// STATUS FORMATTING
// ============================================================

const STATUS_LABELS = {
  pending:     'Pending',
  accepted:    'Accepted',
  approved:    'Approved',
  rejected:    'Rejected',
  cancelled:   'Cancelled',
  scheduled:   'Scheduled',
  in_progress: 'In Progress',
  completed:   'Completed',
  active:      'Active',
  inactive:    'Inactive',
}

/**
 * Convert a raw status string to a human-readable label.
 * e.g. "in_progress" -> "In Progress"
 */
export function formatStatus(status) {
  if (!status) return '-'
  return STATUS_LABELS[status] ?? status
}

// ============================================================
// BADGE CLASS MAPPING
// ============================================================

const STATUS_BADGE_CLASSES = {
  pending:     'badge-pending',
  accepted:    'badge-accepted',
  approved:    'badge-approved',
  rejected:    'badge-rejected',
  cancelled:   'badge-cancelled',
  scheduled:   'badge-scheduled',
  in_progress: 'badge-in_progress',
  completed:   'badge-completed',
  active:      'badge-active',
  inactive:    'badge-inactive',
  student:     'badge-student',
  tutor:       'badge-tutor',
  admin:       'badge-admin',
}

/**
 * Return the CSS class string for a given status badge.
 * Falls back to a neutral badge if status is unknown.
 */
export function getStatusBadgeClass(status) {
  if (!status) return 'badge bg-surface-high text-ink-tertiary'
  return (
    STATUS_BADGE_CLASSES[status] ||
    'badge bg-surface-high text-ink-tertiary'
  )
}

// ============================================================
// STAR RENDERING
// ============================================================

/**
 * Render a string of filled and empty star characters.
 * e.g. renderStars(3) -> "***oo"
 */
export function renderStars(rating = 0, max = 5) {
  const filled = Math.min(Math.max(Math.round(rating), 0), max)
  const empty  = max - filled
  return '\u2605'.repeat(filled) + '\u2606'.repeat(empty)
}

/**
 * Render stars as a JSX element with correct colors.
 * Usage: {renderStarsJSX(tutor.average_rating)}
 */
export function renderStarsJSX(rating = 0, max = 5) {
  const filled = Math.min(Math.max(Math.round(rating), 0), max)
  const empty  = max - filled
  return (
    <>
      <span className="star-filled">
        {'\u2605'.repeat(filled)}
      </span>
      <span className="star-empty">
        {'\u2605'.repeat(empty)}
      </span>
    </>
  )
}

// ============================================================
// DATE / TIME FORMATTING
// ============================================================

/**
 * Format an ISO date string to a readable date + time.
 * e.g. "2025-12-20T14:00:00Z" -> "Dec 20, 2025 at 2:00 PM"
 */
export function formatDateTime(isoString) {
  if (!isoString) return '-'
  try {
    return new Date(isoString).toLocaleString('en-US', {
      month:  'short',
      day:    'numeric',
      year:   'numeric',
      hour:   'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoString
  }
}

/**
 * Format an ISO date string to date only.
 * e.g. "2025-12-20T14:00:00Z" -> "Dec 20, 2025"
 */
export function formatDate(isoString) {
  if (!isoString) return '-'
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    })
  } catch {
    return isoString
  }
}

/**
 * Format an ISO date string to time only.
 * e.g. "2025-12-20T14:00:00Z" -> "2:00 PM"
 */
export function formatTime(isoString) {
  if (!isoString) return '-'
  try {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour:   'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoString
  }
}

/**
 * Return a relative time string.
 * e.g. "2 hours ago", "3 days ago", "just now"
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '-'
  try {
    const diff  = Date.now() - new Date(isoString).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)

    if (mins  < 1)  return 'just now'
    if (mins  < 60) return mins  + 'm ago'
    if (hours < 24) return hours + 'h ago'
    if (days  < 7)  return days  + 'd ago'
    return formatDate(isoString)
  } catch {
    return isoString
  }
}

// ============================================================
// ROLE HELPERS
// ============================================================

/**
 * Return the home dashboard route for a given role.
 */
export function getRoleHome(role) {
  const HOMES = {
    student: '/student/dashboard',
    tutor:   '/tutor/dashboard',
    admin:   '/admin/dashboard',
  }
  return HOMES[role] || '/login'
}

/**
 * Alias for getRoleHome — kept for backwards compatibility
 * with AppRoutes.jsx
 */
export function getDefaultRoute(role) {
  return getRoleHome(role)
}

/**
 * Return a human-readable role label.
 */
export function formatRole(role) {
  if (!role) return '-'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

// ============================================================
// GREETING HELPER
// ============================================================

/**
 * Return a time-aware greeting.
 * e.g. "Morning", "Afternoon", "Evening"
 */
export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

// ============================================================
// INITIALS HELPER
// ============================================================

/**
 * Extract initials from a full name.
 * e.g. "John Doe" -> "JD"
 */
export function getInitials(fullName) {
  if (!fullName) return ''
  return fullName
    .split(' ')
    .map(function(n) { return n[0] })
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ============================================================
// DURATION HELPER
// ============================================================

/**
 * Format duration in minutes to a readable string.
 * e.g. 90 -> "1h 30m", 45 -> "45m"
 */
export function formatDuration(minutes) {
  if (!minutes) return '-'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return m + 'm'
  if (m === 0) return h + 'h'
  return h + 'h ' + m + 'm'
}

// ============================================================
// TRUNCATE HELPER
// ============================================================

/**
 * Truncate a string to a max length with ellipsis.
 * e.g. truncate("Hello World", 8) -> "Hello..."
 */
export function truncate(str, maxLength) {
  if (!str) return ''
  if (!maxLength) maxLength = 100
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}