import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [formData, setFormData] = useState({
    email:    '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Step 1 — call the API directly
      const res = await api.post('/auth/login', {
        email:    formData.email,
        password: formData.password,
      })

      const { access_token, user } = res.data

      // Step 2 — store token + user in AuthContext
      login(access_token, user)

      // Step 3 — redirect based on role
      if (user.role === 'admin')       navigate('/admin/dashboard')
      else if (user.role === 'tutor')  navigate('/tutor/dashboard')
      else                             navigate('/student/dashboard')

    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.')
      } else if (!err.response) {
        setError('Unable to connect to server. Please check your connection.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card slide-up">

        {/* Logo mark */}
        <div className="auth-logo-mark">U</div>

        {/* Heading */}
        <div className="text-center mb-7">
          <h1 className="font-display font-700 text-ink
                         text-xl tracking-tight">
            Welcome back
          </h1>
          <p className="body-text mt-1">
            Sign in to your USIU Tutoring account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error mb-5">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="input-group">
            <label className="input-label">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="you@usiu.ac.ke"
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-2"
          >
            {loading ? (
              <span className="flex items-center
                               justify-center gap-2">
                <span className="spinner-sm" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider my-6" />

        {/* Register link */}
        <p className="text-center text-sm text-ink-tertiary">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-brand font-600
                       hover:text-brand-800 hover:underline
                       transition-colors duration-150"
          >
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login