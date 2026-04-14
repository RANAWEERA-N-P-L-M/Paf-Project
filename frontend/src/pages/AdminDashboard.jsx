import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import adminService from '../services/adminService'
import authService from '../services/authService'
import catalogueService from '../services/catalogueService'

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [catalogues, setCatalogues] = useState([])
  const [showCatalogueModal, setShowCatalogueModal] = useState(false)
  const [editingCatalogueId, setEditingCatalogueId] = useState(null)
  const [savingCatalogue, setSavingCatalogue] = useState(false)
  const [catalogueForm, setCatalogueForm] = useState({
    name: '',
    type: '',
    capacity: '',
    location: '',
    description: '',
    status: 'ACTIVE',
  })
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

  const fetchCatalogues = useCallback(async () => {
    try {
      const res = await catalogueService.getCatalogues()
      setCatalogues(res.data)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout()
        navigate('/login')
      } else {
        setError('Failed to load catalogues.')
      }
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
    fetchCatalogues()
  }, [navigate, fetchUsers, fetchCatalogues])

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

  const handleCatalogueChange = (field, value) => {
    setCatalogueForm((prev) => ({ ...prev, [field]: value }))
  }

  const getCatalogueId = (item) => item.id || item._id

  const resetCatalogueForm = () => {
    setCatalogueForm({
      name: '',
      type: '',
      capacity: '',
      location: '',
      description: '',
      status: 'ACTIVE',
    })
    setEditingCatalogueId(null)
  }

  const openAddCatalogueModal = () => {
    resetCatalogueForm()
    setShowCatalogueModal(true)
  }

  const openEditCatalogueModal = (item) => {
    setEditingCatalogueId(getCatalogueId(item))
    setCatalogueForm({
      name: item.name || '',
      type: item.type || '',
      capacity: item.capacity || '',
      location: item.location || '',
      description: item.description || '',
      status: item.status || 'ACTIVE',
    })
    setShowCatalogueModal(true)
  }

  const handleDeleteCatalogue = async (item) => {
    const catalogueId = getCatalogueId(item)
    if (!catalogueId) {
      setError('Unable to delete catalogue: missing catalogue id.')
      return
    }
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      setError('')
      await catalogueService.deleteCatalogue(catalogueId)
      await fetchCatalogues()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete catalogue.')
    }
  }

  const handleSaveCatalogue = async (e) => {
    e.preventDefault()
    setError('')

    if (!catalogueForm.name.trim() || !catalogueForm.type.trim() || !catalogueForm.location.trim()) {
      setError('Please fill name, type, and location.')
      return
    }

    const parsedCapacity = Number(catalogueForm.capacity)
    if (!parsedCapacity || parsedCapacity <= 0) {
      setError('Capacity must be greater than 0.')
      return
    }

    try {
      setSavingCatalogue(true)
      const payload = {
        name: catalogueForm.name,
        type: catalogueForm.type,
        capacity: parsedCapacity,
        location: catalogueForm.location,
        description: catalogueForm.description,
        status: catalogueForm.status,
      }

      if (editingCatalogueId) {
        await catalogueService.updateCatalogue(editingCatalogueId, payload)
      } else {
        await catalogueService.createCatalogue(payload)
      }
      await fetchCatalogues()
      setShowCatalogueModal(false)
      resetCatalogueForm()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save catalogue.')
    } finally {
      setSavingCatalogue(false)
    }
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

  const catalogueStatusBadge = (status) => {
    const map = {
      ACTIVE: 'bg-green-100 text-green-700',
      OUT_OF_SERVICE: 'bg-red-100 text-red-700',
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
    if (sectionKey === 'facilities') {
      fetchCatalogues()
    }
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

  const renderFacilitiesSection = () => (
    <>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-textPrimary">Facilities & Catalogues</h2>
          <p className="text-sm text-textSecondary mt-1">Manage all facility catalogues in one place.</p>
          <p className="text-xs text-textSecondary mt-2">
            {catalogues.length} catalogue{catalogues.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={openAddCatalogueModal}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition duration-200"
        >
          Add Catalogue
        </button>
      </div>

      {catalogues.length === 0 ? (
        <div className="bg-slate-50 border border-borderColor rounded-xl p-8 text-center">
          <p className="text-textSecondary text-sm">No catalogue added yet. Click "Add Catalogue" to create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {catalogues.map((item, idx) => (
            <div
              key={item.id || item._id || `${item.name}-${idx}`}
              className="group border border-borderColor rounded-2xl bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-textPrimary leading-tight truncate">{item.name}</h3>
                  <p className="text-xs text-textSecondary mt-1">Facility #{idx + 1}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditCatalogueModal(item)}
                    title="Edit catalogue"
                    className="px-2.5 py-1.5 rounded-lg border border-borderColor text-xs font-semibold text-textSecondary hover:text-primary hover:border-primary/40 hover:bg-slate-50 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCatalogue(item)}
                    title="Delete catalogue"
                    className="px-2.5 py-1.5 rounded-lg border border-borderColor text-xs font-semibold text-textSecondary hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-textSecondary uppercase tracking-wide">Status</span>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${catalogueStatusBadge(item.status)}`}>
                  {item.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-slate-50 border border-borderColor rounded-lg p-2">
                  <p className="text-textSecondary">Type</p>
                  <p className="font-semibold text-textPrimary mt-0.5 truncate">{item.type || '-'}</p>
                </div>
                <div className="bg-slate-50 border border-borderColor rounded-lg p-2">
                  <p className="text-textSecondary">Capacity</p>
                  <p className="font-semibold text-textPrimary mt-0.5">{item.capacity || '-'}</p>
                </div>
              </div>

              <div className="text-xs text-textSecondary mb-2">
                <span className="font-semibold">Location:</span> {item.location || '-'}
              </div>

              {item.description && (
                <p className="text-xs text-textSecondary border-t border-borderColor pt-3 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
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
      return renderFacilitiesSection()
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

      {showCatalogueModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-borderColor p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-textPrimary">{editingCatalogueId ? 'Edit Catalogue' : 'Add Catalogue'}</h3>
              <button
                onClick={() => {
                  setShowCatalogueModal(false)
                  resetCatalogueForm()
                }}
                className="text-textSecondary hover:text-textPrimary text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveCatalogue} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">Name</label>
                <input
                  type="text"
                  value={catalogueForm.name}
                  onChange={(e) => handleCatalogueChange('name', e.target.value)}
                  className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Lecture Hall A"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">Type</label>
                  <input
                    type="text"
                    value={catalogueForm.type}
                    onChange={(e) => handleCatalogueChange('type', e.target.value)}
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Lab"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={catalogueForm.capacity}
                    onChange={(e) => handleCatalogueChange('capacity', e.target.value)}
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">Location</label>
                  <input
                    type="text"
                    value={catalogueForm.location}
                    onChange={(e) => handleCatalogueChange('location', e.target.value)}
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Engineering Building"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">Status</label>
                  <select
                    value={catalogueForm.status}
                    onChange={(e) => handleCatalogueChange('status', e.target.value)}
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">Description</label>
                <textarea
                  value={catalogueForm.description}
                  onChange={(e) => handleCatalogueChange('description', e.target.value)}
                  className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={3}
                  placeholder="Optional notes about this facility..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCatalogueModal(false)
                    resetCatalogueForm()
                  }}
                  className="px-4 py-2 rounded-lg border border-borderColor text-sm font-semibold text-textSecondary hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCatalogue}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {savingCatalogue ? 'Saving...' : (editingCatalogueId ? 'Update Catalogue' : 'Save Catalogue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
