import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../services/authService'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.register(form.name, form.email, form.password, form.role)
      const isTechnician = form.role === 'TECHNICIAN'
      navigate(isTechnician ? '/login?msg=pending' : '/login?msg=registered')
    } catch (err) {
      const d = err.response?.data
      const msg =
        (typeof d === 'string' && d) ||
        d?.error ||
        d?.message ||
        (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Cannot reach the server. Is the backend running on port 8081?'
          : null)
      setError(msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: "url('/paf_R.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Left side — shows background image */}
      <div className="w-3/5 relative">
        <div className="absolute inset-0" style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
      </div>

      {/* Right side — form panel */}
      <div className="w-2/5 min-h-screen bg-white flex flex-col justify-center px-16 py-12 shadow-2xl">

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
          <h2 className="text-xl font-bold text-textPrimary">Create your account</h2>
          <p className="text-sm text-textSecondary mt-1">Join UniCore and get started today</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-1.5">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-textSecondary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                className="w-full pl-9 pr-3 py-2.5 border border-borderColor rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-1.5">Email address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-textSecondary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full pl-9 pr-3 py-2.5 border border-borderColor rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-textSecondary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
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

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-1.5">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['USER', 'TECHNICIAN'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`py-2.5 rounded-lg border text-sm font-semibold transition duration-200 ${
                    form.role === r
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-textSecondary border-borderColor hover:border-gray-400'
                  }`}
                >
                  {r === 'USER' ? 'User' : 'Technician'}
                </button>
              ))}
            </div>
            {form.role === 'TECHNICIAN' && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Technician accounts require admin approval before login.
              </p>
            )}
          </div>

          {/* Submit button */}
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
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-7 text-sm text-textSecondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register

