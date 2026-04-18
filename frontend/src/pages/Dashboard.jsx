import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import catalogueService from '../services/catalogueService'
import NotificationBell from '../components/NotificationBell'
import ticketService from '../services/ticketService'

function Dashboard() {
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [activeView, setActiveView] = useState('dashboard')
  const [catalogues, setCatalogues] = useState([])
  const [cataloguesLoading, setCataloguesLoading] = useState(true)
  const [cataloguesError, setCataloguesError] = useState('')
  const [catalogueSearchInput, setCatalogueSearchInput] = useState('')
  const [catalogueSearchTerm, setCatalogueSearchTerm] = useState('')
  const [myTickets, setMyTickets] = useState([])
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
      state: {
        facilityName: item.name || '',
        facilityCapacity: item.capacity ?? null,
        facilityEquipments,
      },
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
        authService.logout()
        navigate('/login')
        return
      }
      setCataloguesError('Unable to load catalogues right now.')
    } finally {
      setCataloguesLoading(false)
    }
  }, [navigate])

  const fetchMyTickets = useCallback(async () => {
    try {
      const response = await ticketService.getMyTickets()
      setMyTickets(response.data || [])
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout()
        navigate('/login')
        return
      }
      // Silently fail for tickets
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
    fetchMyTickets()
  }, [navigate, fetchCatalogues, fetchMyTickets])

  const istechnician = role === 'TECHNICIAN'
  const userType = istechnician ? 'Technician' : 'User'

  const quickStats = istechnician
    ? [
      { label: 'Assigned Tasks', value: '08', accent: 'text-amber-700 bg-amber-50 border-amber-200' },
      { label: 'In Progress', value: '03', accent: 'text-blue-700 bg-blue-50 border-blue-200' },
      { label: 'Completed Today', value: '05', accent: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    ]
    : [
      { label: 'Active Requests', value: String(myTickets.length).padStart(2, '0'), accent: 'text-blue-700 bg-blue-50 border-blue-200' },
      { label: 'Pending Approvals', value: '02', accent: 'text-amber-700 bg-amber-50 border-amber-200' },
      { label: 'Resolved', value: '16', accent: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    ]

  const quickActions = istechnician
    ? [
      { title: 'Start Next Task', helper: 'Pick the highest-priority task and update progress.' },
      { title: 'View Work Orders', helper: 'Check due dates and unresolved dependencies.' },
      { title: 'Upload Report', helper: 'Attach evidence and mark work completion.' },
    ]
    : [
      { title: 'Create New Request', helper: 'Raise a new maintenance or support request.' },
      { title: 'Track My Requests', helper: 'See status updates and assigned technicians.' },
      { title: 'Update Profile', helper: 'Keep your contact details and preferences current.' },
    ]

  const normalizedCatalogueSearch = catalogueSearchTerm.trim().toLowerCase()
  const filteredCatalogues = normalizedCatalogueSearch
    ? catalogues.filter((item) => (item.name || '').toLowerCase().includes(normalizedCatalogueSearch))
    : catalogues

  const renderCatalogueList = () => (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-textPrimary">Available catalogues</h3>
          <p className="text-sm text-textSecondary">Facilities and assets added by admin.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/my-bookings')}
            className="w-fit px-3 py-1.5 rounded-lg border border-borderColor text-sm font-semibold text-textSecondary hover:bg-hoverGray transition"
          >
            My Bookings
          </button>
          {activeView === 'catalogues' && (
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="w-fit px-3 py-1.5 rounded-lg border border-borderColor text-sm font-semibold text-textSecondary hover:bg-hoverGray transition"
            >
              Back to dashboard
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
        <input
          type="text"
          value={catalogueSearchInput}
          onChange={(e) => setCatalogueSearchInput(e.target.value)}
          placeholder="Search by class name"
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

      {cataloguesLoading ? (
        <div className="text-sm text-textSecondary">Loading catalogues...</div>
      ) : cataloguesError ? (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {cataloguesError}
        </div>
      ) : catalogues.length === 0 ? (
        <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
          No catalogues available yet.
        </div>
      ) : filteredCatalogues.length === 0 ? (
        <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
          No catalogues found for that class name.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCatalogues.map((item, idx) => (
            
            <div
              key={item.id || item._id || `${item.name}-${idx}`}
              className="group border border-borderColor rounded-2xl bg-white p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-textPrimary truncate">{item.name}</p>
                  <p className="text-[11px] text-textSecondary mt-1">Catalogue #{idx + 1}</p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full ${
                    item.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-slate-50 border border-borderColor rounded-lg p-2">
                  <p className="text-textSecondary">Type</p>
                  <p className="font-semibold text-textPrimary mt-0.5 truncate">{item.type || '-'}</p>
                </div>
                <div className="bg-slate-50 border border-borderColor rounded-lg p-2">
                  <p className="text-textSecondary">Capacity</p>
                  <p className="font-semibold text-textPrimary mt-0.5">{item.capacity || '-'}</p>
                </div>
              </div>

              <p className="text-xs text-textSecondary mb-2">
                <span className="font-semibold">Location:</span> {item.location || '-'}
              </p>

              <p className="text-xs text-textSecondary mb-2">
                <span className="font-semibold">Equipments:</span>{' '}
                {Array.isArray(item.equipments) && item.equipments.length > 0
                  ? item.equipments.join(', ')
                  : '-'}
              </p>

              {item.description && (
                <p className="text-xs text-textSecondary border-t border-borderColor pt-2.5 leading-relaxed">
                  {item.description}
                </p>
              )}

              <button
                type="button"
                onClick={() => handleBookingClick(item)}
                className={`mt-3 w-full px-3 py-2 rounded-lg text-white text-sm font-semibold transition ${
                  isOutOfService(item.status)
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-primary hover:opacity-90'
                }`}
              >
                {isOutOfService(item.status) ? 'Out of Service' : 'Booking'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-bgLight to-white">
      {/* Navbar */}
      <nav className="bg-primary text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">UniCore</h1>
          <span className="hidden sm:inline text-xs px-2.5 py-1 rounded-full bg-white/15">
            {userType} Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <span className="hidden md:inline text-sm text-white/75">
            {istechnician ? '🔧 Technician Portal' : '👤 User Portal'}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 sm:px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-md hover:bg-hoverGray transition duration-200 active:scale-95"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeView === 'dashboard' && (
          <section className="bg-white rounded-2xl shadow-sm border border-borderColor p-5 sm:p-7 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-hoverGray flex items-center justify-center text-2xl">
                  {istechnician ? '🔧' : '👤'}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-textPrimary">
                    Welcome back!
                  </h2>
                  <p className="text-textSecondary text-sm mt-0.5">
                    Signed in as a{' '}
                    <span className={`font-semibold ${istechnician ? 'text-amber-700' : 'text-blue-700'}`}>
                      {userType}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg px-3 py-2 w-fit">
                Keep your updates current for faster approvals
              </div>
            </div>
          </section>
        )}

        {activeView === 'dashboard' ? (
          <>
            {/* Quick stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {quickStats.map((stat) => (
                <div key={stat.label} className={`border rounded-xl p-4 ${stat.accent}`}>
                  <p className="text-xs sm:text-sm font-semibold opacity-80">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-1">{stat.value}</p>
                </div>
              ))}
            </section>

            {/* Main content */}
            <section className="grid grid-cols-1 gap-5">
              <div className="bg-white rounded-2xl shadow-sm border border-borderColor p-4 sm:p-6">
                <div className="mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-textPrimary">Your workspace</h3>
                  <p className="text-sm text-textSecondary mt-1">
                    Access everything you need from one place.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {istechnician ? (
                    <>
                      <FeatureCard
                        icon="🛠️"
                        title="My Tasks"
                        description="View and manage your assigned maintenance tasks."
                        color="yellow"
                        onClick={() => navigate('/technician/tasks')}
                      />
                      <FeatureCard
                        icon="📋"
                        title="Work Orders"
                        description="Browse open work orders and update their status."
                        color="yellow"
                      />
                      <FeatureCard
                        icon="📊"
                        title="Reports"
                        description="Submit service reports and completion summaries."
                        color="yellow"
                      />
                      <FeatureCard
                        icon="🔔"
                        title="Notifications"
                        description="Stay updated with new assignments and alerts."
                        color="yellow"
                      />
                    </>
                  ) : (
                    <>
                      <FeatureCard
                        icon="📝"
                        title="Submit a Request"
                        description="Raise a new service or maintenance request."
                        color="blue"
                        onClick={() => navigate('/tickets/create')}
                      />
                      <FeatureCard
                        icon="📂"
                        title="View Catalogues"
                        description="Browse all facilities and assets added by admin."
                        color="blue"
                        onClick={() => setActiveView('catalogues')}
                      />
                      <FeatureCard
                        icon="📣"
                        title="Announcements"
                        description="Read the latest campus announcements."
                        color="blue"
                      />
                      <FeatureCard
                        icon="⚙️"
                        title="Profile"
                        description="Manage your account settings and preferences."
                        color="blue"
                      />
                    </>
                  )}
                </div>

                <div className="mt-5 border-t border-borderColor pt-4">
                  <h4 className="text-sm font-semibold text-textPrimary mb-2">Quick actions</h4>
                  <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                    {quickActions.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          if (!istechnician && item.title === 'Create New Request') {
                            navigate('/tickets/create')
                            return
                          }
                          if (!istechnician && item.title === 'Track My Requests') {
                            navigate('/tickets/my')
                            return
                          }
                          if (istechnician && item.title === 'Start Next Task') {
                            navigate('/technician/tasks')
                          }
                        }}
                        className="w-full text-left border border-borderColor rounded-xl p-3 hover:bg-hoverGray hover:border-primary/20 transition duration-200"
                      >
                        <p className="text-sm font-semibold text-textPrimary">{item.title}</p>
                        <p className="text-xs text-textSecondary mt-1">{item.helper}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-borderColor p-4 sm:p-6">
            {renderCatalogueList()}
          </section>
        )}
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description, color, onClick }) {
  const accent = color === 'yellow'
    ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
    : 'bg-blue-50 border-blue-200 hover:border-blue-400'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 sm:p-5 transition duration-200 shadow-sm hover:shadow-md ${accent}`}
    >
      <div className="text-2xl sm:text-3xl mb-2.5">{icon}</div>
      <h3 className="text-sm sm:text-base font-bold text-textPrimary mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">{description}</p>
    </button>
  )
}

export default Dashboard
