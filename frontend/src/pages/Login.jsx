import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import authService from '../services/authService'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const pendingMsg = searchParams.get('msg') === 'pending'
    ? 'Your account is awaiting admin approval.'
    : searchParams.get('msg') === 'rejected'
    ? 'Your account has been rejected.'
    : searchParams.get('msg') === 'error'
    ? 'Google login failed. Please try again.'
    : null

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authService.login(email, password)
      authService.saveAuth(res.data.token, res.data.role)
      navigate(res.data.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8081/oauth2/authorization/google'
  }

  return (
    <div className="min-h-screen bg-bgLight flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Title */}
        <h2 className="text-2xl font-bold text-textPrimary text-center mb-6">
          Login to UniCore
        </h2>

        {/* Info / Error messages */}
        {pendingMsg && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 px-4 py-3 rounded-md mb-4 text-sm">
            {pendingMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent transition duration-200"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-1">
              Password
            </label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="flex-1 px-3 py-2 border border-borderColor rounded-md bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-3 py-2 text-sm text-textSecondary bg-hoverGray border border-borderColor rounded-md hover:bg-gray-200 transition duration-200 whitespace-nowrap"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 bg-primary text-white font-semibold rounded-md hover:bg-[#1f2a30] disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 active:scale-[0.98]"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <hr className="flex-1 border-borderColor" />
          <span className="text-xs text-textSecondary">OR</span>
          <hr className="flex-1 border-borderColor" />
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-2 flex items-center justify-center gap-2 border border-borderColor bg-white text-textPrimary font-medium rounded-md hover:bg-hoverGray transition duration-200 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-5 text-sm text-textSecondary">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-accent font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
