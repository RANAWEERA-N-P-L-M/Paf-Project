import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import adminService from '../services/adminService'
import authService from '../services/authService'

function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resetPasswordId, setResetPasswordId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const navigate = useNavigate()
  const initialized = useRef(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminService.getUsers()
      setUsers(res.data)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout()
        navigate('/login')
      } else {
        setError('Failed to load users.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (authService.getRole() !== 'ADMIN') {
      navigate('/login', { replace: true })
      return
    }
    fetchUsers()
  }, [navigate, fetchUsers])

  const handleApprove = async (id) => {
    try {
      await adminService.approveUser(id)
      fetchUsers()
    } catch {
      setError('Failed to approve user.')
    }
  }

  const handleReject = async (id) => {
    try {
      await adminService.rejectUser(id)
      fetchUsers()
    } catch {
      setError('Failed to reject user.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await adminService.deleteUser(id)
      fetchUsers()
    } catch {
      setError('Failed to delete user.')
    }
  }

  const handleResetPassword = async (id) => {
    if (!newPassword.trim()) {
      setError('Password cannot be empty.')
      return
    }
    try {
      await adminService.resetPassword(id, newPassword)
      setResetPasswordId(null)
      setNewPassword('')
      alert('Password reset successfully.')
    } catch {
      setError('Failed to reset password.')
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const roleBadge = (role) => {
    const map = {
      ADMIN: 'bg-purple-100 text-purple-700',
      USER: 'bg-blue-100 text-blue-700',
      TECHNICIAN: 'bg-yellow-100 text-yellow-700',
    }
    return map[role] ?? 'bg-gray-100 text-gray-600'
  }

  const statusBadge = (status) => {
    const map = {
      APPROVED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      REJECTED: 'bg-red-100 text-red-600',
    }
    return map[status] ?? 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bgLight flex items-center justify-center">
        <p className="text-textSecondary text-lg animate-pulse">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bgLight">
      <nav className="bg-primary text-white px-6 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold tracking-tight">UniCore — Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-md hover:bg-hoverGray transition duration-200 active:scale-95"
        >
          Logout
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <p className="text-textSecondary text-sm">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-borderColor overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-borderColor">
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Provider</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`border-b border-borderColor hover:bg-hoverGray transition duration-150 ${idx === users.length - 1 ? 'border-none' : ''}`}
                >
                  <td className="px-4 py-3 text-textPrimary font-medium whitespace-nowrap">{user.name}</td>
                  <td className="px-4 py-3 text-textSecondary whitespace-nowrap">{user.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${roleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-textSecondary whitespace-nowrap">{user.provider}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusBadge(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      {user.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md transition duration-200 active:scale-95"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md transition duration-200 active:scale-95"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {user.status === 'APPROVED' && (
                        <button
                          onClick={() => handleReject(user.id)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md transition duration-200 active:scale-95"
                        >
                          Revoke
                        </button>
                      )}
                      {user.status === 'REJECTED' && (
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md transition duration-200 active:scale-95"
                        >
                          Re-approve
                        </button>
                      )}
                      <button
                        onClick={() => { setResetPasswordId(user.id); setNewPassword('') }}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded-md transition duration-200 active:scale-95"
                      >
                        Reset PW
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold rounded-md transition duration-200 active:scale-95"
                      >
                        Delete
                      </button>

                      {resetPasswordId === user.id && (
                        <div className="flex flex-wrap gap-2 items-center mt-1 w-full">
                          <input
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="px-2 py-1 text-xs border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-accent transition duration-200"
                          />
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md transition duration-200 active:scale-95"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setResetPasswordId(null)}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-textSecondary text-xs font-semibold rounded-md transition duration-200 active:scale-95"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
