import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import adminService from '../services/adminService'
import authService from '../services/authService'
import catalogueService from '../services/catalogueService'
import bookingService from '../services/bookingService'
import ticketService from '../services/ticketService'
import AdminTicketDashboard from '../components/tickets/AdminTicketDashboard'
import NotificationBell from '../components/NotificationBell'

function AdminDashboard() {
  const catalogueTypeOptions = ['Lecture Hall', 'Lab', 'Meeting Room']
  const locationOptions = ['New Building', 'Main Building']
  const equipmentOptions = ['Projector', 'Camera', 'Sounds', 'Smart Screen']

  const capacityOptionsByType = {
    'Lecture Hall': ['50-60', '100-120'],
    Lab: ['30-40', '50-60'],
    'Meeting Room': ['1-5', '5-10'],
  }

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
    equipments: [],
    description: '',
    status: 'ACTIVE',
  })
  const [isEquipmentDropdownOpen, setIsEquipmentDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingNotes, setBookingNotes] = useState({})
  const [bookingActionId, setBookingActionId] = useState('')
  const [resetPasswordId, setResetPasswordId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [tickets, setTickets] = useState([])
  const navigate = useNavigate()
  const initialized = useRef(false)
  const equipmentDropdownRef = useRef(null)

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

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const res = await bookingService.getAllBookings()
      setBookings(res.data || [])
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout()
        navigate('/login')
      } else {
        setError(err.response?.data?.error || 'Failed to load bookings.')
      }
    } finally {
      setBookingsLoading(false)
    }
  }, [navigate])

  const fetchTickets = useCallback(async () => {
    try {
      const res = await ticketService.getAllTickets()
      setTickets(res.data || [])
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout()
        navigate('/login')
      } else {
        setError(err.response?.data?.error || 'Failed to load tickets.')
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
    fetchBookings()
    fetchTickets()
  }, [navigate, fetchUsers, fetchCatalogues, fetchBookings, fetchTickets])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!equipmentDropdownRef.current?.contains(event.target)) {
        setIsEquipmentDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

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

  const handleCatalogueTypeChange = (value) => {
    setCatalogueForm((prev) => ({
      ...prev,
      type: value,
      capacity: '',
    }))
  }

  const toggleEquipmentOption = (equipment) => {
    setCatalogueForm((prev) => {
      const alreadySelected = prev.equipments.includes(equipment)
      return {
        ...prev,
        equipments: alreadySelected
          ? prev.equipments.filter((item) => item !== equipment)
          : [...prev.equipments, equipment],
      }
    })
  }

  const getCapacityOptions = () => capacityOptionsByType[catalogueForm.type] || []

  const getCatalogueId = (item) => item.id || item._id

  const resetCatalogueForm = () => {
    setCatalogueForm({
      name: '',
      type: '',
      capacity: '',
      location: '',
      equipments: [],
      description: '',
      status: 'ACTIVE',
    })
    setEditingCatalogueId(null)
    setIsEquipmentDropdownOpen(false)
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
      equipments: Array.isArray(item.equipments) ? item.equipments : [],
      description: item.description || '',
      status: item.status || 'ACTIVE',
    })
    setIsEquipmentDropdownOpen(false)
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

    if (!catalogueForm.capacity.trim()) {
      setError('Please select a capacity.')
      return
    }

    if (!catalogueForm.equipments.length) {
      setError('Please select at least one equipment.')
      return
    }

    try {
      setSavingCatalogue(true)
      const payload = {
        name: catalogueForm.name,
        type: catalogueForm.type,
        capacity: catalogueForm.capacity,
        location: catalogueForm.location,
        equipments: catalogueForm.equipments,
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

  const handleBookingNoteChange = (bookingId, value) => {
    setBookingNotes((prev) => ({
      ...prev,
      [bookingId]: value,
    }))
  }

  const handleApproveBooking = async (bookingId) => {
    setBookingActionId(bookingId)
    setError('')
    try {
      await bookingService.approveBooking(bookingId, bookingNotes[bookingId] || '')
      setBookingNotes((prev) => ({ ...prev, [bookingId]: '' }))
      await fetchBookings()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve booking.')
    } finally {
      setBookingActionId('')
    }
  }

  const handleRejectBooking = async (bookingId) => {
    const reason = (bookingNotes[bookingId] || '').trim()
    if (!reason) {
      setError('Reject reason is required.')
      return
    }

    setBookingActionId(bookingId)
    setError('')
    try {
      await bookingService.rejectBooking(bookingId, reason)
      setBookingNotes((prev) => ({ ...prev, [bookingId]: '' }))
      await fetchBookings()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject booking.')
    } finally {
      setBookingActionId('')
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

  const bookingStatusBadge = (status) => {
    const map = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-700',
    }
    return map[status] ?? 'bg-gray-100 text-gray-700'
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
    if (sectionKey === 'bookings') {
      fetchBookings()
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
      key: 'facilities',
      title: 'Total Catalogues',
      count: catalogues.length,
      accent: 'border-violet-200 bg-violet-50',
      textColor: 'text-violet-700',
      icon: '🏢',
    },
    {
      key: 'bookings',
      title: 'Total Bookings',
      count: bookings.length,
      accent: 'border-emerald-200 bg-emerald-50',
      textColor: 'text-emerald-700',
      icon: '📅',
    },
    {
      key: 'tickets',
      title: 'Total Tickets',
      count: tickets.length,
      accent: 'border-amber-200 bg-amber-50',
      textColor: 'text-amber-700',
      icon: '🎫',
    },
  ]

  const mostBookedResources = Object.values(
    bookings.reduce((accumulator, booking) => {
      if (booking.status !== 'APPROVED') {
        return accumulator
      }

      const resourceKey = booking.facilityId || booking.facilityName || 'Unknown Resource'
      const currentItem = accumulator[resourceKey] || {
        key: resourceKey,
        name: booking.facilityName || 'Unknown Resource',
        count: 0,
      }

      currentItem.count += 1
      accumulator[resourceKey] = currentItem
      return accumulator
    }, {})
  )
    .sort((left, right) => right.count - left.count)
    .slice(0, 5)

  const highestResourceBookingCount = mostBookedResources[0]?.count || 0

  const renderUsersSection = () => (
    <div className="flex flex-col h-full">
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

      <div className="hidden md:block bg-white rounded-lg shadow-md border border-borderColor overflow-y-auto overflow-x-auto flex-1 min-h-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-borderColor sticky top-0 z-10">
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
    </div>
  )

  const renderFacilitiesSection = () => (
    <div className="flex flex-col h-full">
      <div className="mb-5 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

      <div className="flex-1 min-h-0 overflow-y-auto">
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

              <div className="text-xs text-textSecondary mb-2">
                <span className="font-semibold">Equipments:</span>{' '}
                {Array.isArray(item.equipments) && item.equipments.length > 0
                  ? item.equipments.join(', ')
                  : '-'}
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
      </div>
    </div>
  )

  const renderBookingsSection = () => (
    <>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-textPrimary">Bookings</h2>
          <p className="text-sm text-textSecondary mt-1">Review booking requests and approve or reject with a response.</p>
          <p className="text-xs text-textSecondary mt-2">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition duration-200"
        >
          Refresh
        </button>
      </div>

      {bookingsLoading ? (
        <p className="text-sm text-textSecondary">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="bg-slate-50 border border-borderColor rounded-xl p-8 text-center">
          <p className="text-textSecondary text-sm">No bookings found.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden mb-4">
            {bookings.map((item) => (
              <div key={`booking-card-${item.id}`} className="bg-white rounded-lg shadow-sm border border-borderColor p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-textPrimary text-sm">{item.facilityName}</p>
                    <p className="text-xs text-textSecondary break-all">{item.userName || item.userEmail || item.userId}</p>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${bookingStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-textSecondary">{item.bookingDate} | {item.startTime} - {item.endTime}</p>
                <p className="text-xs text-textSecondary mt-1">Purpose: {item.purpose}</p>

                {item.status === 'REJECTED' && item.adminResponse && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mt-2">
                    Reason: {item.adminResponse}
                  </p>
                )}

                {item.status === 'PENDING' && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={bookingNotes[item.id] || ''}
                      onChange={(e) => handleBookingNoteChange(item.id, e.target.value)}
                      placeholder="Admin message (required for reject)"
                      className="w-full px-2 py-1 text-xs border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleApproveBooking(item.id)}
                        disabled={bookingActionId === item.id}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectBooking(item.id)}
                        disabled={bookingActionId === item.id}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-lg shadow-md border border-borderColor overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-borderColor">
                  <th className="px-4 py-3 text-left font-semibold text-textSecondary">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-textSecondary">Facility</th>
                  <th className="px-4 py-3 text-left font-semibold text-textSecondary">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-textSecondary">Time</th>
                  <th className="px-4 py-3 text-left font-semibold text-textSecondary">Purpose</th>
                  <th className="px-4 py-3 text-left font-semibold text-textSecondary">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-textSecondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-borderColor hover:bg-hoverGray transition duration-150 ${idx === bookings.length - 1 ? 'border-none' : ''}`}
                  >
                    <td className="px-4 py-3 text-textPrimary">
                      <p className="font-medium">{item.userName || 'Unknown User'}</p>
                      <p className="text-xs text-textSecondary">{item.userEmail || item.userId}</p>
                    </td>
                    <td className="px-4 py-3 text-textSecondary">{item.facilityName}</td>
                    <td className="px-4 py-3 text-textSecondary whitespace-nowrap">{item.bookingDate}</td>
                    <td className="px-4 py-3 text-textSecondary whitespace-nowrap">{item.startTime} - {item.endTime}</td>
                    <td className="px-4 py-3 text-textSecondary">
                      <p>{item.purpose}</p>
                      {item.status === 'REJECTED' && item.adminResponse && (
                        <p className="mt-1 text-xs text-red-700">Reason: {item.adminResponse}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${bookingStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'PENDING' ? (
                        <div className="space-y-2 min-w-[230px]">
                          <input
                            type="text"
                            value={bookingNotes[item.id] || ''}
                            onChange={(e) => handleBookingNoteChange(item.id, e.target.value)}
                            placeholder="Message (required for reject)"
                            className="w-full px-2 py-1 text-xs border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleApproveBooking(item.id)}
                              disabled={bookingActionId === item.id}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectBooking(item.id)}
                              disabled={bookingActionId === item.id}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-textSecondary">
                          {item.adminResponse ? `Response: ${item.adminResponse}` : 'No action available'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )

  const renderMainDashboard = () => (
    <>
      <h2 className="text-2xl font-bold text-textPrimary mb-6">Main Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="mt-6 bg-white border border-borderColor rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-textPrimary">Most Booked Resources</h3>
            <p className="text-sm text-textSecondary mt-1">Top resources based on approved bookings.</p>
          </div>
          <span className="text-xs font-semibold text-textSecondary bg-slate-50 border border-borderColor rounded-full px-3 py-1">
            Top 5
          </span>
        </div>

        {mostBookedResources.length === 0 ? (
          <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
            No approved bookings yet to calculate resource usage.
          </div>
        ) : (
          <div className="space-y-3">
            {mostBookedResources.map((resource) => {
              const barWidth = highestResourceBookingCount > 0
                ? Math.max(12, Math.round((resource.count / highestResourceBookingCount) * 100))
                : 0

              return (
                <div key={resource.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-textPrimary truncate">{resource.name}</p>
                      <p className="text-xs text-textSecondary">{resource.count} approved booking{resource.count !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{resource.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )

  const renderSectionContent = () => {
    if (activeSection === 'users') return renderUsersSection()
    if (activeSection === 'facilities') {
      return renderFacilitiesSection()
    }
    if (activeSection === 'bookings') {
      return renderBookingsSection()
    }
    if (activeSection === 'tickets') {
      return <AdminTicketDashboard technicians={users} />
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
    <div className="h-screen flex flex-col bg-bgLight overflow-hidden">
      <nav className="bg-primary text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">UniCore Admin</h1>
          <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-white/20">
            {activeNavItem?.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
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

      <main className="flex-1 overflow-hidden w-full px-3 sm:px-5 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-6 h-full">
          <aside className={`${isMenuOpen ? 'block mb-1 lg:mb-0' : 'hidden lg:block'} lg:h-full overflow-hidden`}>
            <div className="bg-white border border-borderColor rounded-2xl shadow-sm p-4 h-full overflow-y-auto">
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

          <section className="min-w-0 bg-white border border-borderColor rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col overflow-hidden">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
                {error}
              </div>
            )}

            <div className="flex-1 flex flex-col min-h-0">
              {renderSectionContent()}
            </div>
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
                  <select
                    value={catalogueForm.type}
                    onChange={(e) => handleCatalogueTypeChange(e.target.value)}
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select Type</option>
                    {catalogueTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">Capacity</label>
                  <select
                    value={catalogueForm.capacity}
                    onChange={(e) => handleCatalogueChange('capacity', e.target.value)}
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={!catalogueForm.type}
                  >
                    <option value="">Select Capacity</option>
                    {getCapacityOptions().map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">Location</label>
                  <select
                    value={catalogueForm.location}
                    onChange={(e) => handleCatalogueChange('location', e.target.value)}
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select Location</option>
                    {locationOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
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
                <label className="block text-xs font-semibold text-textSecondary mb-1">Equipments</label>
                <div className="relative" ref={equipmentDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsEquipmentDropdownOpen((prev) => !prev)}
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    {catalogueForm.equipments.length
                      ? catalogueForm.equipments.join(', ')
                      : 'Select Equipments'}
                  </button>

                  {isEquipmentDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full max-h-44 overflow-auto border border-borderColor rounded-lg bg-white shadow-md p-1">
                      {equipmentOptions.map((option) => {
                        const isSelected = catalogueForm.equipments.includes(option)
                        return (
                          <label
                            key={option}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              toggleEquipmentOption(option)
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-sm text-textPrimary"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleEquipmentOption(option)}
                              className="h-3.5 w-3.5"
                            />
                            <span>{option}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-textSecondary mt-1">Click or right-click an item to tick or untick it.</p>
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
