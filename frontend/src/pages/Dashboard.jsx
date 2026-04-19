import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import catalogueService from '../services/catalogueService'
import bookingService from '../services/bookingService'
import NotificationBell from '../components/NotificationBell'
import ticketService from '../services/ticketService'
import TicketCreateForm from '../components/tickets/TicketCreateForm'
import TechnicianTaskDashboard from '../components/tickets/TechnicianTaskDashboard'
import useCurrentUser from '../hooks/useCurrentUser'

// ── helpers ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    OPEN: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    RESOLVED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-600',
    REJECTED: 'bg-red-100 text-red-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    ACCEPTED: 'bg-blue-100 text-blue-700',
  }
  const cls = map[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
      {(status || 'UNKNOWN').replace(/_/g, ' ')}
    </span>
  )
}

function StatCard({ label, value, icon, gradient }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-borderColor shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
      <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center text-white text-2xl shadow-md shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-extrabold text-textPrimary leading-none">{value}</p>
        <p className="text-xs text-textSecondary mt-1.5 font-medium">{label}</p>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-borderColor hover:border-accent/40 hover:shadow-sm bg-white hover:bg-orange-50/60 transition-all duration-200 group text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-accent/20 flex items-center justify-center text-lg transition-all duration-200 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-textPrimary group-hover:text-accent transition-colors truncate">{label}</p>
        <p className="text-[11px] text-textSecondary truncate leading-tight mt-0.5">{sub}</p>
      </div>
      <span className="text-textSecondary/50 group-hover:text-accent text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">›</span>
    </button>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [activeSection, setActiveSection] = useState('home') // home | facilities
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // data
  const [myTickets, setMyTickets] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [myAssignments, setMyAssignments] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  // catalogues
  const [catalogues, setCatalogues] = useState([])
  const [cataloguesLoading, setCataloguesLoading] = useState(false)
  const [cataloguesError, setCataloguesError] = useState('')
  const [catalogueSearchInput, setCatalogueSearchInput] = useState('')
  const [catalogueSearchTerm, setCatalogueSearchTerm] = useState('')

  // booking cancel state
  const [bookingActionId, setBookingActionId] = useState('')
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState('')

  // catalogue filters
  const [typeFilter, setTypeFilter] = useState('')
  const [capacityFilter, setCapacityFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  const checked = useRef(false)

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const isOutOfService = (status) => String(status || '').trim().toUpperCase() === 'OUT_OF_SERVICE'

  const handleBookingClick = (item) => {
    if (isOutOfService(item.status)) {
      setCataloguesError('')
      window.alert('This facility is out of service and cannot be booked.')
      return
    }

    const facilityId = item.id || item._id
    if (!facilityId) {
      setCataloguesError('Unable to open booking form: missing facility id.')
      return
    }

    const facilityEquipments = Array.isArray(item.equipments)
      ? item.equipments
        .map((equipment) => (equipment ?? '').toString().trim())
        .filter(Boolean)
      : []

    setCataloguesError('')

    navigate(`/booking/${facilityId}`, {
      state: { facilityName: item.name || '', facilityCapacity: item.capacity ?? null },
    })
  }

  const fetchCatalogues = useCallback(async () => {
    setCataloguesLoading(true)
    setCataloguesError('')
    try {
      const response = await catalogueService.getCatalogues()
      setCatalogues(response.data || [])
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout(); navigate('/login'); return
      }
      setCataloguesError('Unable to load catalogues right now.')
    } finally {
      setCataloguesLoading(false)
    }
  }, [navigate])

  const fetchDashboardData = useCallback(async (isTech) => {
    setDataLoading(true)
    try {
      if (isTech) {
        const res = await ticketService.getMyAssignments().catch(() => null)
        if (res) setMyAssignments(res.data || [])
      } else {
        const [ticketRes, bookingRes] = await Promise.allSettled([
          ticketService.getMyTickets(),
          bookingService.getMyBookings(),
        ])
        if (ticketRes.status === 'fulfilled') setMyTickets(ticketRes.value.data || [])
        if (bookingRes.status === 'fulfilled') setMyBookings(bookingRes.value.data || [])
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout(); navigate('/login')
      }
    } finally {
      setDataLoading(false)
    }
  }, [navigate])

  const fetchMyTasks = useCallback(async () => {
    try {
      const response = await ticketService.getMyAssignments()
      setMyTasks(response.data || [])
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout()
        navigate('/login')
        return
      }
    }
  }, [navigate])

  useEffect(() => {
    if (checked.current) return
    checked.current = true
    const r = authService.getRole()
    if (!r || r === 'ADMIN') {
      navigate('/login', { replace: true })
      return
    }
    setRole(r)
    fetchCatalogues()
    fetchDashboardData(r === 'TECHNICIAN')
  }, [navigate, fetchCatalogues, fetchDashboardData])

  const isTech = role === 'TECHNICIAN'
  const currentUser = useCurrentUser()

  // ── computed stats from real API data ──────────────────────────────────────
  const openTickets    = myTickets.filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length
  const pendingTickets = myTickets.filter(t => t.status === 'PENDING').length
  const resolvedTickets = myTickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length

  const assignedTasks   = myAssignments.filter(a => a.status === 'PENDING').length
  const inProgressTasks = myAssignments.filter(a => a.status === 'IN_PROGRESS').length
  const completedTasks  = myAssignments.filter(a => ['COMPLETED', 'RESOLVED'].includes(a.status)).length

  const recentTickets     = [...myTickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)
  const recentBookings    = [...myBookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  const recentAssignments = [...myAssignments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)

  const normalizedSearch = catalogueSearchTerm.trim().toLowerCase()
  const filteredCatalogues = catalogues.filter(item => {
    if (normalizedSearch && !(item.name || '').toLowerCase().includes(normalizedSearch)) return false
    if (typeFilter && item.type !== typeFilter) return false
    if (locationFilter && item.location !== locationFilter) return false
    if (capacityFilter && String(item.capacity) !== capacityFilter) return false
    return true
  })

  const catalogueTypeOptions = [...new Set(catalogues.map(c => c.type).filter(Boolean))]
  const catalogueLocationOptions = [...new Set(catalogues.map(c => c.location).filter(Boolean))]
  const catalogueCapacityOptions = [...new Set(catalogues.map(c => c.capacity).filter(v => v != null))].sort((a, b) => Number(a) - Number(b))

  // ── sidebar nav ────────────────────────────────────────────────────────────
  const navItems = isTech
    ? [
        { id: 'home', icon: '🏠', label: 'Dashboard' },
        { id: 'tasks', icon: '🛠️', label: 'My Tasks' },
      ]
    : [
        { id: 'home', icon: '🏠', label: 'Dashboard' },
        { id: 'facilities', icon: '🏛️', label: 'Facilities & Catalogues' },
        { id: 'tickets', icon: '🎫', label: 'My Tickets' },
        { id: 'bookings', icon: '📅', label: 'My Bookings' },
        { id: 'new', icon: '➕', label: 'New Request' },
      ]

  const handleNavClick = (item) => {
    setSidebarOpen(false)
    if (item.id === 'facilities') {
      setActiveSection('facilities')
      if (catalogues.length === 0) fetchCatalogues()
      return
    }
    if (item.path) { navigate(item.path); return }
    setActiveSection(item.id)
  }

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    setBookingActionId(id)
    setBookingError('')
    setBookingMessage('')
    try {
      await bookingService.cancelBooking(id)
      setBookingMessage('Booking cancelled successfully.')
      const res = await bookingService.getMyBookings()
      setMyBookings(res.data || [])
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Failed to cancel booking.')
    } finally {
      setBookingActionId('')
    }
  }

  // ── my tickets section ────────────────────────────────────────────────────
  const renderTickets = () => (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-textPrimary">My Tickets</h3>
          <p className="text-sm text-textSecondary mt-0.5">Track the status of all your submitted requests.</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveSection('new')}
          className="text-sm bg-accent text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition"
        >
          + New Request
        </button>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center py-16 text-textSecondary text-sm gap-2">
          <span className="animate-spin">⏳</span> Loading tickets…
        </div>
      ) : myTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">🎫</span>
          <p className="text-textSecondary text-sm font-medium">No tickets raised yet.</p>
          <button
            type="button"
            onClick={() => setActiveSection('new')}
            className="bg-accent text-white text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition"
          >
            Submit your first request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...myTickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(ticket => (
            <div key={ticket.id} className="bg-white border border-borderColor rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-textPrimary">{ticket.title}</p>
                  <p className="text-xs text-textSecondary mt-0.5">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '–'}
                    {ticket.category ? ` · ${ticket.category}` : ''}
                    {ticket.priority ? ` · Priority: ${ticket.priority}` : ''}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
              {ticket.description && (
                <p className="text-sm text-textSecondary mb-2 line-clamp-2">{ticket.description}</p>
              )}

              {/* Assigned Technicians */}
              <div className="mt-3 pt-3 border-t border-borderColor">
                <p className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
                  Assigned Technicians
                </p>
                {ticket.assignedTechnicians?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ticket.assignedTechnicians.map(tech => {
                      const statusMap = {
                        OPEN: 'bg-blue-50 border-blue-200 text-blue-700',
                        IN_PROGRESS: 'bg-purple-50 border-purple-200 text-purple-700',
                        RESOLVED: 'bg-green-50 border-green-200 text-green-700',
                        CLOSED: 'bg-gray-50 border-gray-200 text-gray-600',
                        REJECTED: 'bg-red-50 border-red-200 text-red-700',
                        ACCEPTED: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                      }
                      const st = tech.assignmentStatus || 'OPEN'
                      const cls = statusMap[st] || 'bg-gray-50 border-gray-200 text-gray-600'
                      return (
                        <div
                          key={`${ticket.id}-${tech.assignmentId || tech.technicianId}`}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${cls}`}
                        >
                          <span className="w-6 h-6 rounded-full bg-white/60 border border-current flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(tech.name || tech.email || 'T').charAt(0).toUpperCase()}
                          </span>
                          <span className="font-semibold">{tech.name || tech.email || tech.technicianId}</span>
                          <span className="opacity-60">·</span>
                          <span className="uppercase tracking-wide text-[10px]">{st.replace(/_/g, ' ')}</span>
                          {tech.rejectionReason && (
                            <span className="ml-1 text-red-600 font-normal">— {tech.rejectionReason}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-textSecondary">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">?</span>
                    <span>No technician assigned yet</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── my bookings section ───────────────────────────────────────────────────
  const renderBookings = () => (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-textPrimary">My Bookings</h3>
          <p className="text-sm text-textSecondary mt-0.5">Track and manage your facility bookings.</p>
        </div>
        <button
          type="button"
          onClick={() => { setActiveSection('facilities'); if (catalogues.length === 0) fetchCatalogues() }}
          className="text-sm bg-accent text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition"
        >
          + Book Facility
        </button>
      </div>

      {bookingMessage && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">{bookingMessage}</div>
      )}
      {bookingError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{bookingError}</div>
      )}

      {dataLoading ? (
        <div className="flex items-center justify-center py-16 text-textSecondary text-sm gap-2">
          <span className="animate-spin">⏳</span> Loading bookings…
        </div>
      ) : myBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">📅</span>
          <p className="text-textSecondary text-sm font-medium">No bookings yet.</p>
          <button
            type="button"
            onClick={() => { setActiveSection('facilities'); if (catalogues.length === 0) fetchCatalogues() }}
            className="bg-accent text-white text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition"
          >
            Browse Facilities
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...myBookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(item => {
            const statusStyle = {
              PENDING:   { bar: 'bg-yellow-400', card: 'border-yellow-200', icon: '🕐' },
              APPROVED:  { bar: 'bg-green-500',  card: 'border-green-200',  icon: '✅' },
              REJECTED:  { bar: 'bg-red-500',    card: 'border-red-200',    icon: '❌' },
              CANCELLED: { bar: 'bg-gray-400',   card: 'border-gray-200',   icon: '🚫' },
            }
            const s = statusStyle[item.status] || { bar: 'bg-gray-300', card: 'border-borderColor', icon: '📅' }
            return (
              <div key={item.id} className={`bg-white border ${s.card} rounded-2xl overflow-hidden shadow-sm`}>
                {/* coloured top bar */}
                <div className={`h-1 w-full ${s.bar}`} />

                <div className="p-4">
                  {/* header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{s.icon}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-textPrimary truncate">{item.facilityName}</p>
                        <p className="text-xs text-textSecondary mt-0.5">
                          Requested {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {/* detail chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-borderColor rounded-lg text-xs text-textSecondary">
                      📆 <span className="font-medium text-textPrimary">{item.bookingDate || '–'}</span>
                    </span>
                    {item.startTime && item.endTime && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-borderColor rounded-lg text-xs text-textSecondary">
                        🕒 <span className="font-medium text-textPrimary">{item.startTime} – {item.endTime}</span>
                      </span>
                    )}
                    {item.attendees && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-borderColor rounded-lg text-xs text-textSecondary">
                        👥 <span className="font-medium text-textPrimary">{item.attendees} attendees</span>
                      </span>
                    )}
                  </div>

                  {/* purpose */}
                  {item.purpose && (
                    <p className="text-sm text-textSecondary mb-2">
                      <span className="font-semibold text-textPrimary">Purpose: </span>{item.purpose}
                    </p>
                  )}

                  {/* rejection reason */}
                  {item.status === 'REJECTED' && item.adminResponse && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
                      <span className="text-red-500 mt-0.5 shrink-0">⚠️</span>
                      <p className="text-sm text-red-700"><span className="font-semibold">Reason:</span> {item.adminResponse}</p>
                    </div>
                  )}

                  {/* admin message for approved */}
                  {item.status === 'APPROVED' && item.adminResponse && (
                    <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mt-2">
                      <span className="text-green-600 mt-0.5 shrink-0">💬</span>
                      <p className="text-sm text-green-700"><span className="font-semibold">Note:</span> {item.adminResponse}</p>
                    </div>
                  )}

                  {/* cancel button */}
                  {(item.status === 'PENDING' || item.status === 'APPROVED') && (
                    <div className="mt-3 pt-3 border-t border-borderColor">
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(item.id)}
                        disabled={bookingActionId === item.id}
                        className="px-4 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-300 border border-borderColor text-textSecondary text-sm font-semibold rounded-lg disabled:opacity-60 transition"
                      >
                        {bookingActionId === item.id ? 'Cancelling…' : '🚫 Cancel Booking'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── new request section ───────────────────────────────────────────────────
  const renderNewRequest = () => (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-textPrimary">New Request</h3>
          <p className="text-sm text-textSecondary mt-0.5">Submit a new maintenance or service ticket.</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveSection('home')}
          className="text-sm text-textSecondary hover:text-textPrimary border border-borderColor rounded-lg px-3 py-1.5 hover:bg-hoverGray transition"
        >
          ← Back
        </button>
      </div>
      <TicketCreateForm />
    </div>
  )

  // ── catalogue section ──────────────────────────────────────────────────────
  const renderFacilities = () => (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-textPrimary">Facilities & Catalogues</h3>
          <p className="text-sm text-textSecondary mt-0.5">Book a facility for your event or class.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
        <input
          type="text"
          value={catalogueSearchInput}
          onChange={e => setCatalogueSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setCatalogueSearchTerm(catalogueSearchInput)}
          placeholder="Search facility by name…"
          className="w-full sm:max-w-sm border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={() => setCatalogueSearchTerm(catalogueSearchInput)}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition duration-200"
        >
          Search
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Types</option>
          {catalogueTypeOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <select
          value={capacityFilter}
          onChange={(e) => setCapacityFilter(e.target.value)}
          className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Capacities</option>
          {catalogueCapacityOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Locations</option>
          {catalogueLocationOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {cataloguesLoading ? (
        <div className="flex items-center justify-center py-16 text-textSecondary text-sm gap-2">
          <span className="animate-spin">⏳</span> Loading facilities…
        </div>
      ) : cataloguesError ? (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">{cataloguesError}</div>
      ) : filteredCatalogues.length === 0 ? (
        <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-xl p-4 text-center">
          {catalogues.length === 0 ? 'No facilities available yet.' : 'No results for that search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCatalogues.map((item, idx) => (
            
            <div
              key={item.id || item._id || `${item.name}-${idx}`}
              className="group bg-white border border-borderColor rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent/40 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-textPrimary truncate">{item.name}</p>
                  <p className="text-[11px] text-textSecondary mt-0.5">{item.type || 'Facility'}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-slate-50 border border-borderColor rounded-lg p-2">
                  <p className="text-textSecondary">Capacity</p>
                  <p className="font-semibold text-textPrimary mt-0.5">{item.capacity || '–'}</p>
                </div>
                <div className="bg-slate-50 border border-borderColor rounded-lg p-2">
                  <p className="text-textSecondary">Location</p>
                  <p className="font-semibold text-textPrimary mt-0.5 truncate">{item.location || '–'}</p>
                </div>
              </div>

              {Array.isArray(item.equipments) && item.equipments.length > 0 && (
                <p className="text-xs text-textSecondary mb-2 truncate">
                  <span className="font-semibold">Equipment:</span> {item.equipments.join(', ')}
                </p>
              )}
              {item.description && (
                <p className="text-xs text-textSecondary border-t border-borderColor pt-2 leading-relaxed line-clamp-2">{item.description}</p>
              )}

              <button
                type="button"
                onClick={() => handleBookingClick(item)}
                className="mt-3 w-full py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── tasks section (technician) ───────────────────────────────────────────
  const renderTasks = () => (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-textPrimary">My Assigned Tasks</h3>
          <p className="text-sm text-textSecondary mt-0.5">Accept, update progress, and resolve your maintenance tasks.</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveSection('home')}
          className="text-sm text-textSecondary hover:text-textPrimary border border-borderColor rounded-lg px-3 py-1.5 hover:bg-hoverGray transition"
        >
          ← Back
        </button>
      </div>
      <TechnicianTaskDashboard />
    </div>
  )

  // ── home section ───────────────────────────────────────────────────────────
  const renderHome = () => (
    <>
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary via-[#3a4f5c] to-[#2F3E46] rounded-2xl p-5 sm:p-6 mb-6 text-white relative">
        {/* decorative circles clipped inside the banner */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5 translate-y-1/2" />
        </div>
        <div className="relative">
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1.5">
            {isTech ? '🔧 Technician Portal' : '👤 User Portal'}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold leading-snug">
            Welcome back{currentUser.name ? `, ${currentUser.name}` : ''}! 👋
          </h3>
          <p className="text-white/65 text-sm mt-1.5 leading-relaxed">
            {isTech
              ? 'Check your assigned maintenance tasks and update progress.'
              : 'Submit requests, book facilities and track your work.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className={`grid ${isTech ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'} gap-3 sm:gap-4 mb-6`}>
        {isTech ? (
          <>
            <StatCard label="Assigned" value={dataLoading ? '–' : assignedTasks} icon="📋" gradient="bg-gradient-to-br from-amber-400 to-amber-600" />
            <StatCard label="In Progress" value={dataLoading ? '–' : inProgressTasks} icon="⚙️" gradient="bg-gradient-to-br from-blue-400 to-blue-600" />
            <StatCard label="Completed" value={dataLoading ? '–' : completedTasks} icon="✅" gradient="bg-gradient-to-br from-emerald-400 to-emerald-600" />
            <StatCard label="Total Tasks" value={dataLoading ? '–' : myAssignments.length} icon="📊" gradient="bg-gradient-to-br from-purple-400 to-purple-600" />
          </>
        ) : (
          <>
            <StatCard label="Catalogues" value={cataloguesLoading ? '–' : catalogues.length} icon="🏛️" gradient="bg-gradient-to-br from-blue-400 to-blue-600" />
            <StatCard label="Bookings" value={dataLoading ? '–' : myBookings.length} icon="📅" gradient="bg-gradient-to-br from-purple-400 to-purple-600" />
          </>
        )}
      </div>

      {/* Middle row: Quick Actions + Recent Bookings (user) / Recent Assignments (tech) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-borderColor shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center text-sm">⚡</div>
            <h4 className="text-sm font-bold text-textPrimary">Quick Actions</h4>
          </div>
          <div className="space-y-2">
            {isTech ? (
                <ActionBtn icon="🛠️" label="My Assigned Tasks" sub="Update task status and progress" onClick={() => setActiveSection('tasks')} />
            ) : (
              <>
                <ActionBtn icon="➕" label="Submit New Request" sub="Raise a maintenance or service ticket" onClick={() => setActiveSection('new')} />
                <ActionBtn icon="🎫" label="Track My Tickets" sub="View status of all your requests" onClick={() => setActiveSection('tickets')} />
                <ActionBtn icon="📅" label="My Bookings" sub="View and manage your bookings" onClick={() => setActiveSection('bookings')} />
                <ActionBtn icon="🏛️" label="Facilities & Catalogues" sub="View all available facilities" onClick={() => { setActiveSection('facilities'); if (catalogues.length === 0) fetchCatalogues() }} />
              </>
            )}
          </div>
        </div>

        {/* Recent Bookings (user) / Recent Assignments (tech) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-borderColor shadow-sm p-5">
          {isTech ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-sm">📋</div>
                  <h4 className="text-sm font-bold text-textPrimary">Recent Assignments</h4>
                </div>
                <button type="button" onClick={() => setActiveSection('tasks')} className="text-xs text-accent font-semibold hover:underline">View all →</button>
              </div>
              {dataLoading ? (
                <div className="flex items-center justify-center py-10 text-textSecondary text-sm gap-2"><span className="animate-spin text-base">⏳</span> Loading…</div>
              ) : recentAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-textSecondary text-sm gap-2">
                  <span className="text-4xl">🛠️</span>
                  <p className="font-medium">No assignments yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-borderColor">
                  {recentAssignments.map(item => (
                    <div key={item.id || item._id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-textPrimary truncate">{item.title || item.subject || `Task #${item.id}`}</p>
                        <p className="text-xs text-textSecondary mt-0.5">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}
                          {item.priority ? ` · ${item.priority}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-sm">📅</div>
                  <h4 className="text-sm font-bold text-textPrimary">Recent Bookings</h4>
                </div>
                <button type="button" onClick={() => setActiveSection('bookings')} className="text-xs text-accent font-semibold hover:underline">View all →</button>
              </div>
              {dataLoading ? (
                <div className="flex items-center justify-center py-8 text-textSecondary text-sm gap-2"><span className="animate-spin">⏳</span> Loading…</div>
              ) : recentBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-textSecondary text-sm gap-2">
                  <span className="text-4xl">📅</span>
                  <p className="font-medium">No bookings yet.</p>
                  <button type="button" onClick={() => { setActiveSection('facilities'); if (catalogues.length === 0) fetchCatalogues() }} className="mt-1 text-xs border border-borderColor text-textSecondary hover:bg-hoverGray px-4 py-1.5 rounded-lg transition">Facilities & Catalogues</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-textSecondary border-b border-borderColor">
                        <th className="text-left pb-2 font-semibold">Facility</th>
                        <th className="text-left pb-2 font-semibold hidden sm:table-cell">Booking Date</th>
                        <th className="text-left pb-2 font-semibold hidden md:table-cell">Requested On</th>
                        <th className="text-left pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderColor">
                      {recentBookings.map(b => (
                        <tr key={b.id || b._id} className="hover:bg-hoverGray/40">
                          <td className="py-2.5 font-medium text-textPrimary">{b.facilityName || b.facility?.name || '–'}</td>
                          <td className="py-2.5 text-textSecondary hidden sm:table-cell">{b.bookingDate || b.date || '–'}</td>
                          <td className="py-2.5 text-textSecondary hidden md:table-cell">{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}</td>
                          <td className="py-2.5"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </>
  )

  // ── layout ─────────────────────────────────────────────────────────────────
  const activeNavLabel = navItems.find(item => item.id === activeSection)?.label
    ?? (isTech ? 'Technician Portal' : 'User Portal')

  return (
    <div className="h-screen flex flex-col bg-bgLight overflow-hidden">

      {/* Top nav – matches admin style */}
      <nav className="bg-gradient-to-r from-primary to-[#3a4f5c] text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-sm font-bold border border-white/20 shrink-0">U</div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">UniCore</h1>
          <span className="hidden sm:inline text-xs px-2.5 py-1 rounded-full bg-white/20 font-medium border border-white/15">
            {activeNavLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setSidebarOpen(prev => !prev)}
            className="lg:hidden px-3 py-1.5 bg-white/15 text-white font-semibold text-sm rounded-md hover:bg-white/20 transition duration-200"
          >
            {sidebarOpen ? 'Close' : 'Menu'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 sm:px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-lg hover:bg-orange-50 hover:text-accent transition-all duration-200 active:scale-95 shadow-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Grid: sidebar + content */}
      <main className="flex-1 overflow-hidden w-full px-3 sm:px-5 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-6 h-full">

          {/* Sidebar – white card, collapses on mobile */}
          <aside className={`${sidebarOpen ? 'block mb-1 lg:mb-0' : 'hidden lg:block'} lg:h-full overflow-hidden`}>
            <div className="bg-white border border-borderColor rounded-2xl shadow-sm p-4 h-full overflow-y-auto flex flex-col">

              {/* User profile section */}
              <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-borderColor">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
                  {currentUser.name
                    ? currentUser.name.charAt(0).toUpperCase()
                    : currentUser.email
                    ? currentUser.email.charAt(0).toUpperCase()
                    : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-textPrimary truncate leading-tight">
                    {currentUser.name || currentUser.email || 'User'}
                  </p>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-0.5 ${isTech ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isTech ? 'Technician' : 'User'}
                  </span>
                </div>
              </div>

              <p className="px-3 pb-2 text-[10px] uppercase tracking-wider text-textSecondary font-bold border-b border-borderColor">
                Navigation
              </p>
              <nav className="space-y-1 mt-2 flex-1">
                {navItems.map(item => {
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary to-[#3d5260] text-white shadow-sm'
                          : 'text-textSecondary hover:bg-slate-50 hover:text-textPrimary'
                      }`}
                    >
                      <span className={`text-base ${isActive ? '' : 'opacity-70'}`} aria-hidden="true">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Content – white card */}
          <section className="min-w-0 bg-white border border-borderColor rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {activeSection === 'facilities' ? renderFacilities()
                : activeSection === 'tickets' ? renderTickets()
                : activeSection === 'bookings' ? renderBookings()
                : activeSection === 'new' ? renderNewRequest()
                : activeSection === 'tasks' ? renderTasks()
                : renderHome()}
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}

export default Dashboard

