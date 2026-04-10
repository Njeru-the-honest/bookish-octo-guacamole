/**
 * StatCard
 *
 * Compact metric display card.
 *
 * Usage:
 *   <StatCard
 *     label="Total Users"
 *     value={42}
 *     icon="👥"
 *     bg="bg-tonal-brand"
 *     color="text-brand"
 *   />
 *
 *   <StatCard
 *     label="Pending"
 *     value={loading ? null : count}
 *     icon="⏳"
 *     bg="bg-tonal-warning"
 *     color="text-warning-600"
 *     loading={loading}
 *   />
 */

function StatCard({
  label,
  value,
  icon,
  bg        = 'bg-surface-low',
  color     = 'text-ink-secondary',
  loading   = false,
  className = '',
  onClick,
}) {
  if (loading) {
    return (
      <div className={`skeleton h-20 rounded-xl ${className}`} />
    )
  }

  return (
    <div
      className={`card-sm flex items-center gap-4 fade-in
                  ${onClick ? 'cursor-pointer' : ''}
                  ${className}`}
      onClick={onClick}
    >
      {/* Icon container */}
      <div className={`stat-icon ${bg}`}>
        <span className={`text-xl ${color}`}>{icon}</span>
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="stat-value">{value ?? '—'}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  )
}

export default StatCard