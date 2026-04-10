/**
 * errorUtils.js
 *
 * Centralised error message extraction for API responses.
 */

/**
 * Extract a human-readable error message from an
 * Axios error response.
 *
 * Handles:
 *   - FastAPI validation errors (detail array)
 *   - FastAPI string detail errors
 *   - Network errors
 *   - Generic fallback
 *
 * Usage:
 *   catch (err) {
 *     setError(getErrorMessage(err, 'Something went wrong.'))
 *   }
 */
export function getErrorMessage(
  err,
  fallback = 'Something went wrong. Please try again.'
) {
  if (!err) return fallback

  // Network error (no response from server)
  if (!err.response) {
    return 'Unable to connect to the server. ' +
           'Please check your connection.'
  }

  const detail = err.response?.data?.detail

  // FastAPI validation error — array of field errors
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = d.loc?.slice(1).join(' → ') || ''
        const msg   = d.msg || ''
        return field ? `${field}: ${msg}` : msg
      })
      .filter(Boolean)
      .join('. ')
  }

  // FastAPI string detail error
  if (typeof detail === 'string') {
    return detail
  }

  // HTTP status fallbacks
  const status = err.response?.status
  if (status === 400) return 'Invalid request. Please check your input.'
  if (status === 401) return 'You are not authenticated. Please log in.'
  if (status === 403) return 'You do not have permission to do this.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 409) return 'A conflict occurred. This may already exist.'
  if (status === 422) return 'Invalid data submitted. Please check your input.'
  if (status >= 500)  return 'A server error occurred. Please try again later.'

  return fallback
}

/**
 * Check if an error is an authentication error (401).
 */
export function isAuthError(err) {
  return err?.response?.status === 401
}

/**
 * Check if an error is a permission error (403).
 */
export function isPermissionError(err) {
  return err?.response?.status === 403
}

/**
 * Check if an error is a not-found error (404).
 */
export function isNotFoundError(err) {
  return err?.response?.status === 404
}

/**
 * Check if an error is a validation error (422).
 */
export function isValidationError(err) {
  return err?.response?.status === 422
}

/**
 * Check if an error is a server error (5xx).
 */
export function isServerError(err) {
  return err?.response?.status >= 500
}