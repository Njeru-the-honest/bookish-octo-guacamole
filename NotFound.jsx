import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate()

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
          404
        </p>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-surface-low
                        flex items-center justify-center
                        text-3xl mx-auto mb-5 -mt-8">
          🗺️
        </div>

        <h1 className="font-display font-700 text-ink
                       text-xl mb-2 tracking-tight">
          Page not found
        </h1>
        <p className="body-text mb-8">
          The page you are looking for does not exist
          or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>

      </div>
    </div>
  )
}

export default NotFound