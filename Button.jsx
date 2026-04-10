/**
 * Button
 *
 * Variants:
 *   primary   → brand gradient + shadow
 *   secondary → soft surface
 *   tertiary  → ghost / text only
 *   success   → emerald
 *   danger    → rose
 *
 * Sizes:
 *   sm  → text-xs  px-3   py-1.5
 *   md  → text-sm  px-4.5 py-2.5  (default)
 *   lg  → text-sm  px-6   py-3
 *   full → w-full
 *
 * Usage:
 *   <Button>Save</Button>
 *   <Button variant="danger" size="sm">Delete</Button>
 *   <Button variant="primary" size="full" loading>Saving...</Button>
 *   <Button variant="secondary" icon="✕">Cancel</Button>
 */

const VARIANTS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  tertiary:  'btn-tertiary',
  success:   'btn-success',
  danger:    'btn-danger',
}

const SIZES = {
  sm:   'text-xs  px-3   py-1.5',
  md:   'text-sm  px-4.5 py-2.5',
  lg:   'text-sm  px-6   py-3',
  full: 'text-sm  px-4.5 py-2.5 w-full',
}

function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  icon,
  className = '',
  type      = 'button',
  onClick,
  ...props
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary
  const sizeClass    = SIZES[size]       || SIZES.md

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner-sm" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}

export default Button