/**
 * EmptyState
 *
 * Centered empty content placeholder.
 *
 * Usage:
 *   <EmptyState
 *     icon="📋"
 *     title="No requests yet"
 *     body="Browse tutors to send your first request."
 *   />
 *
 *   <EmptyState
 *     icon="🔍"
 *     title="No results"
 *     body="Try a different search term."
 *     action={
 *       <Button variant="secondary" onClick={clearSearch}>
 *         Clear Search
 *       </Button>
 *     }
 *   />
 */

function EmptyState({
  icon,
  title,
  body,
  action,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && (
        <p className="empty-state-icon">{icon}</p>
      )}
      {title && (
        <p className="empty-state-title">{title}</p>
      )}
      {body && (
        <p className="empty-state-body">{body}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState