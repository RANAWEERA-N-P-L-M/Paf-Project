import { useState } from 'react'
import { Link } from 'react-router-dom'
import authService from '../services/authService'

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await authService.register(
        form.name,
        form.email,
        form.password,
        form.role
      )
      setMessage(res.data.message || 'Registration submitted. Waiting for admin approval.')
      setForm({ name: '', email: '', password: '', role: 'USER' })
    } catch (err) {
      const d = err.response?.data
      const msg =
        (typeof d === 'string' && d) ||
        d?.error ||
        d?.message ||
        (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Cannot reach the server. Is the backend running on port 8081? Check the browser address matches CORS (use http://localhost:5173 or http://127.0.0.1:5173).'
          : null)
      setError(msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent transition duration-200'
  const labelClass = 'block text-sm font-semibold text-textSecondary mb-1'

  return (
    <div className="min-h-screen bg-bgLight flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Title */}
        <h2 className="text-2xl font-bold text-textPrimary text-center mb-6">
          Register for UniCore
        </h2>

        {/* Success / Error messages */}
        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-600 px-4 py-3 rounded-md mb-4 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              className={inputClass}
            />
          </div>

          {/* Role dropdown */}
          <div>
            <label className={labelClass}>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="USER">User</option>
              <option value="TECHNICIAN">Technician</option>
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 bg-primary text-white font-semibold rounded-md hover:bg-[#1f2a30] disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 active:scale-[0.98]"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-5 text-sm text-textSecondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
