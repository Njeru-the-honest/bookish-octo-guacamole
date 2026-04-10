/**
 * Badge
 *
 * Pill-shaped status indicator.
 *
 * Preset status values (auto-styled):
 *   pending, accepted, approved, rejected,
 *   cancelled, scheduled, in_progress,
 *   completed, active, inactive,
 *   student, tutor, admin
 *
 * Or pass a custom `color` prop:
 *   brand | success | warning | danger | neutral
 *
 * Usage:
 *   <Badge status="pending" />
 *   <Badge status="completed" />
 *   <Badge status="tutor" />
 *   <Badge color="warning">Custom Label</Badge>
 */

const STATUS_MAP = {
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

const COLOR_MAP = {
  brand:   'badge bg-brand-100   text-brand-700',
  success: 'badge bg-success-100 text-success-700',
  warning: 'badge bg-warning-100 text-warning-700',
  danger:  'badge bg-danger-100  text-danger-700',
  neutral: 'badge bg-surface-high text-ink-tertiary',
}

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
  student:     'Student',
  tutor:       'Tutor',
  admin:       'Admin',
}

function Badge({
  status,
  color,
  children,
  className = '',
}) {
  const cls = status
    ? (STATUS_MAP[status] || 'badge bg-surface-high text-ink-tertiary')
    : color
      ? (COLOR_MAP[color] || COLOR_MAP.neutral)
      : 'badge bg-surface-high text-ink-tertiary'

  const label = children
    ?? (status ? STATUS_LABELS[status] ?? status : '')

  return (
    <span className={`${cls} ${className}`}>
      {label}
    </span>
  )
}

export default Badge