/**
 * Modal
 *
 * Accessible overlay modal with blurred backdrop.
 *
 * Usage:
 *   <Modal
 *     open={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Confirm Action"
 *     subtitle="This cannot be undone."
 *     maxWidth="max-w-md"
 *     footer={
 *       <>
 *         <Button variant="secondary" onClick={onClose}>
 *           Cancel
 *         </Button>
 *         <Button variant="danger" onClick={handleDelete}>
 *           Delete
 *         </Button>
 *        *       </>
 *     }
 *   >
 *     <p>Modal body content goes here.</p>
 *   </Modal>
 */

import { useEffect } from 'react'

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth  = 'max-w-md',
  className = '',
}) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className={`modal-panel ${maxWidth} w-full
                    scale-in ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="modal-header">
            <div>
              {title && (
                <h3
                  id="modal-title"
                  className="section-title"
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="caption-text mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="modal-close"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal