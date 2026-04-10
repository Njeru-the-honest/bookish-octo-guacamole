/**
 * Card
 *
 * Tonal surface container — no borders, elevation via shadow.
 *
 * Variants:
 *   default  → card   (p-6, rounded-xl)
 *   sm       → card-sm (p-4, rounded-lg)
 *   hover    → card-hover (lifts on hover)
 *   flat     → no shadow, surface-low background
 *
 * Usage:
 *   <Card>...</Card>
 *   <Card variant="sm">...</Card>
 *   <Card variant="hover" onClick={fn}>...</Card>
 *   <Card variant="flat">...</Card>
 *   <Card noPadding>...</Card>
 */

function Card({
  children,
  variant   = 'default',
  noPadding = false,
  className = '',
  onClick,
  ...props
}) {
  const BASE = {
    default: 'card',
    sm:      'card-sm',
    hover:   'card-hover',
    flat:    'bg-surface-low rounded-xl',
  }

  const base    = BASE[variant] || BASE.default
  const padding = noPadding ? 'p-0 overflow-hidden' : ''

  return (
    <div
      className={`${base} ${padding} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card