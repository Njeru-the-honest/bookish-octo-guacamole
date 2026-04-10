import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Unauthorized() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const HOME_ROUTES = {
    student: '/student/dashboard',
    tutor:   '/tutor/dashboard',
    admin:   '/admin/dashboard',
  }

  const homeRoute = HOME_ROUTES[user?.role] || '/login'

  return (
    <div className="min-h-screen bg-surface flex items-center
                    justify-center p-6">
      <div className="text-center max-w-sm slide-up">

        {/* Large number */}
        <p className="font-display font-800 text-ink
                      leading-none mb-4"
           style={{ fontSize: '7rem',
                    letterSpacing: '-0.04em',
                    opacity: 0.08 }}>
          403
        </p>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-danger-100
                        flex items-center justify-center
                        text-3xl mx-auto mb-5 -mt-8">
          🔒
        </div>

        <h1 className="font-display font-700 text-ink
                       text-xl mb-2 tracking-tight">
          Access denied
        </h1>
        <p className="body-text mb-8">
          You do not have permission to view this page.
          Please contact an administrator if you believe
          this is a mistake.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate(homeRoute)}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}

export default Unauthorized