import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import adminService from '../services/adminService'
import authService from '../services/authService'

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

  const navItems = [
    { key: 'dashboard', label: 'Main Dashboard', icon: '📊' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'facilities', label: 'Facilities & Catalogues', icon: '🏢' },
    { key: 'bookings', label: 'Bookings', icon: '📅' },
    { key: 'tickets', label: 'Tickets', icon: '🎫' },
  ]

  const activeNavItem = navItems.find((item) => item.key === activeSection)

  const switchSection = (sectionKey) => {
    setActiveSection(sectionKey)
    setIsMenuOpen(false)
  }

  const summaryCards = [
    {
      key: 'users',
      title: 'Total Users',
      count: users.length,
      accent: 'border-blue-200 bg-blue-50',
      textColor: 'text-blue-700',
      icon: '👥',
    },
    {
      key: 'bookings',
      title: 'Total Bookings',
      count: 0,
      accent: 'border-emerald-200 bg-emerald-50',
      textColor: 'text-emerald-700',
      icon: '📅',
    },
    {
      key: 'tickets',
      title: 'Total Tickets',
      count: 0,
      accent: 'border-amber-200 bg-amber-50',
      textColor: 'text-amber-700',
      icon: '🎫',
    },
  ]

  const renderUsersSection = () => (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-textPrimary">Users</h2>
        <p className="text-textSecondary text-sm">
          {users.length} user{users.length !== 1 ? 's' : ''} total
        </p>
      </div>

      <div className="grid gap-3 md:hidden mb-4">
        {users.map((user) => (
          <div key={`card-${user.id}`} className="bg-white rounded-lg shadow-sm border border-borderColor p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-textPrimary text-sm">{user.name}</p>
                <p className="text-xs text-textSecondary break-all">{user.email}</p>
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadge(user.status)}`}>
                {user.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleBadge(user.role)}`}>
                {user.role}
              </span>
              <span className="text-xs text-textSecondary">{user.provider}</span>
            </div>

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
                onClick={() => {
                  setResetPasswordId(user.id)
                  setNewPassword('')
                }}
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
          </div>
        ))}
      </div>

      <div className="hidden md:block bg-white rounded-lg shadow-md border border-borderColor overflow-x-auto">
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
                      onClick={() => {
                        setResetPasswordId(user.id)
                        setNewPassword('')
                      }}
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
    </>
  )

  const renderPlaceholder = (title, description) => (
    <div className="bg-white rounded-lg shadow-md border border-borderColor p-8 text-center">
      <h2 className="text-2xl font-bold text-textPrimary mb-3">{title}</h2>
      <p className="text-textSecondary text-sm mb-4">{description}</p>
      <p className="text-xs text-textSecondary/80">This page is ready for your next features.</p>
    </div>
  )

  const renderMainDashboard = () => (
    <>
      <h2 className="text-2xl font-bold text-textPrimary mb-6">Main Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.key}
            className={`rounded-xl border ${card.accent} p-5 shadow-sm hover:shadow-md transition duration-200`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-textSecondary">{card.title}</p>
              <span className="text-xl" aria-hidden="true">{card.icon}</span>
            </div>
            <p className={`text-3xl font-extrabold ${card.textColor}`}>{card.count}</p>
            <button
              onClick={() => switchSection(card.key)}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              View details
            </button>
          </div>
        ))}
      </div>
    </>
  )

  const renderSectionContent = () => {
    if (activeSection === 'users') return renderUsersSection()
    if (activeSection === 'facilities') {
      return renderPlaceholder('Facilities & Catalogues', 'Manage facilities and catalogues from here.')
    }
    if (activeSection === 'bookings') {
      return renderPlaceholder('Bookings', 'View and manage all booking records on this page.')
    }
    if (activeSection === 'tickets') {
      return renderPlaceholder('Tickets', 'Track support and maintenance tickets here.')
    }
    return renderMainDashboard()
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
      <nav className="bg-primary text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">UniCore Admin</h1>
          <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-white/20">
            {activeNavItem?.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="lg:hidden px-3 py-1.5 bg-white/15 text-white font-semibold text-sm rounded-md hover:bg-white/20 transition duration-200"
          >
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
          <button
            onClick={handleLogout}
            className="px-3 sm:px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-md hover:bg-hoverGray transition duration-200 active:scale-95"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="w-full px-3 sm:px-5 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-6 items-stretch min-h-[calc(100vh-88px)]">
          <aside className={`${isMenuOpen ? 'block mb-1 lg:mb-0' : 'hidden lg:block'} lg:h-full`}>
            <div className="bg-white border border-borderColor rounded-2xl shadow-sm p-4 h-full min-h-[calc(100vh-88px)] overflow-y-auto">
              <p className="px-3 pb-3 text-xs uppercase tracking-wide text-textSecondary font-semibold border-b border-borderColor">
                Navigation
              </p>
              <nav className="space-y-2 mt-3">
                {navItems.map((item) => {
                  const isActive = activeSection === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => switchSection(item.key)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition duration-150 ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-textSecondary bg-slate-50 hover:bg-hoverGray hover:text-textPrimary'
                      }`}
                    >
                      <span className="mr-3" aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          <section className="min-w-0 bg-white border border-borderColor rounded-2xl shadow-sm p-4 sm:p-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
                {error}
              </div>
            )}

            {renderSectionContent()}
          </section>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
