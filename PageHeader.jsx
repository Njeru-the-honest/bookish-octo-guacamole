/**
 * PageHeader
 *
 * Consistent page-level heading with optional
 * subtitle and right-side action slot.
 *
 * Usage:
 *   <PageHeader
 *     title="Browse Tutors"
 *     subtitle="Find an approved tutor and send a request."
 *   />
 *
 *   <PageHeader
 *     title="My Profile"
 *     subtitle="Manage your tutor profile."
 *     action={
 *       <Button variant="secondary">Edit</Button>
 *     }
 *   />
 */

function PageHeader({
  title,
  subtitle,
  action,
  className = '',
}) {
  return (
    <div className={`page-header ${className}`}>
      <div className="page-header-inner">

        {/* Left: title + subtitle */}
        <div>
          <h2 className="page-title">{title}</h2>
          {subtitle && (
            <p className="body-text mt-1">{subtitle}</p>
          )}
        </div>

        {/* Right: action slot */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}

      </div>
    </div>
  )
}

export default PageHeader