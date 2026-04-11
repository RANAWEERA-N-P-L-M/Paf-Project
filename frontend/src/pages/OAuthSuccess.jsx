import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import authService from '../services/authService'

function OAuthSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const processed = useRef(false)
  const [mode, setMode] = useState(null)
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleName, setGoogleName] = useState('')
  const [role, setRole] = useState('USER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Guard against React StrictMode double-invocation
    if (processed.current) return
    processed.current = true

    const action = searchParams.get('action')
    const token = searchParams.get('token')
    const err = searchParams.get('error')

    if (action === 'select-role') {
      setGoogleEmail(searchParams.get('email') || '')
      setGoogleName(searchParams.get('name') || '')
      setMode('select-role')
      return
    }

    if (err === 'pending') {
      navigate('/login?msg=pending')
      return
    }

    if (err === 'rejected') {
      navigate('/login?msg=rejected')
      return
    }

    if (token) {
      // Prefer the explicit role param; fall back to decoding JWT
      let userRole = searchParams.get('role')
      if (!userRole) {
        try {
          const base64Url = token.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
          const payload = JSON.parse(atob(padded))
          userRole = payload.role
        } catch {
          navigate('/login?msg=error')
          return
        }
      }
      authService.saveAuth(token, userRole)
      navigate(userRole === 'ADMIN' ? '/admin' : '/dashboard', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [navigate, searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.oauth2Complete(googleEmail, googleName, role)
      navigate('/login?msg=pending')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'select-role') {
    return (
      <div className="min-h-screen bg-bgLight flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          {/* Google icon + heading */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-hoverGray flex items-center justify-center mb-3">
              <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-textPrimary">Almost there!</h2>
            <p className="text-sm text-textSecondary mt-1 text-center">
              Signed in as <span className="font-semibold text-textPrimary">{googleEmail}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-textSecondary mb-2">
                Select your role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['USER', 'TECHNICIAN'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-semibold transition duration-200 ${
                      role === r
                        ? 'border-accent bg-orange-50 text-accent'
                        : 'border-borderColor bg-white text-textSecondary hover:border-accent hover:bg-orange-50'
                    }`}
                  >
                    {r === 'USER' ? '👤 User' : '🔧 Technician'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary text-white font-semibold rounded-md hover:bg-[#1f2a30] disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 active:scale-[0.98]"
            >
              {loading ? 'Submitting...' : 'Complete Registration'}
            </button>
          </form>

          <p className="text-center mt-4 text-xs text-textSecondary">
            Your account will be reviewed by an admin before you can log in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bgLight flex items-center justify-center">
      <p className="text-textSecondary text-lg animate-pulse">Processing Google login, please wait...</p>
    </div>
  )
}

export default OAuthSuccess
