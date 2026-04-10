import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const DEPARTMENTS = [
  'School of Science & Technology',
  'School of Business',
  'School of Humanities & Social Sciences',
  'School of Law',
  'School of Pharmacy & Health Sciences',
  'Administration',
  'Other',
]

function Register() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [formData, setFormData] = useState({
    full_name:            '',
    email:                '',
    password:             '',
    confirm_password:     '',
    school_or_department: '',
    year_of_study:        '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      // Step 1 — register the user
      await api.post('/auth/register', {
        full_name:            formData.full_name,
        email:                formData.email,
        password:             formData.password,
        school_or_department: formData.school_or_department,
        year_of_study:        formData.year_of_study
          ? parseInt(formData.year_of_study)
          : null,
      })

      // Step 2 — log them in immediately
      const loginRes = await api.post('/auth/login', {
        email:    formData.email,
        password: formData.password,
      })

      const { access_token, user } = loginRes.data

      // Step 3 — store in AuthContext
      login(access_token, user)

      // Step 4 — redirect to student dashboard
      navigate('/student/dashboard')

    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join('. '))
      } else if (!err.response) {
        setError('Unable to connect to server.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card slide-up"
           style={{ maxWidth: '460px' }}>

        {/* Logo mark */}
        <div className="auth-logo-mark">U</div>

        {/* Heading */}
        <div className="text-center mb-7">
          <h1 className="font-display font-700 text-ink
                         text-xl tracking-tight">
            Create your account
          </h1>
          <p className="body-text mt-1">
            Join the USIU Peer Tutoring platform
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error mb-5">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="input-field"
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="input-field"
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">
              School / Department
            </label>
            <select
              name="school_or_department"
              value={formData.school_or_department}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select your school...</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">
              Year of Study
              <span className="text-ink-disabled font-400
                               ml-1 normal-case">
                (optional)
              </span>
            </label>
            <select
              name="year_of_study"
              value={formData.year_of_study}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select year...</option>
              {[1,2,3,4,5].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
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
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider my-6" />

        <p className="text-center text-sm text-ink-tertiary">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-brand font-600
                       hover:text-brand-800 hover:underline
                       transition-colors duration-150"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register