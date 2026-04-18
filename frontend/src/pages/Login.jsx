import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BACKEND_ORIGIN } from '../config/api'
import authService from '../services/authService'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exiting, setExiting] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleGoToRegister = () => {
    setExiting(true)
    setTimeout(() => navigate('/register'), 320)
  }

  const pendingMsg = searchParams.get('msg') === 'pending'
    ? 'Your account is awaiting admin approval.'
    : searchParams.get('msg') === 'rejected'
    ? 'Your account has been rejected.'
    : searchParams.get('msg') === 'error'
    ? 'Google login failed. Please try again.'
    : searchParams.get('msg') === 'registered'
    ? 'Registration successful! You can now log in.'
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
    window.location.href = `${BACKEND_ORIGIN}/oauth2/authorization/google`
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: "url('/paf_L.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Left side — shows background image */}
      <div className="flex-1" />

      {/* Right side — form panel */}
      <div className={`flex-1 min-h-screen bg-white flex flex-col justify-center px-16 py-12 shadow-2xl ${exiting ? 'form-exit' : 'form-enter'}`}>

        {/* Branding */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 17.22V21H3v-3.78a12.083 12.083 0 012.84-6.642L12 14z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-textPrimary tracking-tight">UniCore</h1>
          </div>
          <h2 className="text-xl font-bold text-textPrimary">Welcome back</h2>
          <p className="text-sm text-textSecondary mt-1">Sign in to continue to your account</p>
        </div>

        {/* Info / Error messages */}
        {pendingMsg && (
          <div className={`flex items-start gap-2 px-4 py-3 rounded-lg mb-5 text-sm ${
            searchParams.get('msg') === 'registered'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {pendingMsg}
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-1.5">
              Email address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-textSecondary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-9 pr-3 py-2.5 border border-borderColor rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-textSecondary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-9 pr-16 py-2.5 border border-borderColor rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-textSecondary hover:text-textPrimary transition"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-[#1f2a30] disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 active:scale-[0.98] shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <hr className="flex-1 border-borderColor" />
          <span className="text-xs text-textSecondary font-medium">OR CONTINUE WITH</span>
          <hr className="flex-1 border-borderColor" />
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-2.5 flex items-center justify-center gap-3 border border-borderColor bg-white text-textPrimary font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition duration-200 active:scale-[0.98] shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-7 text-sm text-textSecondary">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={handleGoToRegister}
            className="text-accent font-semibold hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
