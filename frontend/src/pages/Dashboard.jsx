import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'

function Dashboard() {
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true
    const r = authService.getRole()
    if (!r || r === 'ADMIN') {
      navigate('/login', { replace: true })
      return
    }
    setRole(r)
  }, [navigate])

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const istechnician = role === 'TECHNICIAN'

  return (
    <div className="min-h-screen bg-bgLight">
      {/* Navbar */}
      <nav className="bg-primary text-white px-6 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold tracking-tight">UniCore</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70">
            {istechnician ? '🔧 Technician' : '👤 User'}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-md hover:bg-hoverGray transition duration-200 active:scale-95"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome card */}
        <div className="bg-white rounded-xl shadow-md border border-borderColor p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-hoverGray flex items-center justify-center text-2xl">
              {istechnician ? '🔧' : '👤'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-textPrimary">
                Welcome back!
              </h2>
              <p className="text-textSecondary text-sm mt-0.5">
                You are logged in as a{' '}
                <span className={`font-semibold ${istechnician ? 'text-yellow-600' : 'text-blue-600'}`}>
                  {istechnician ? 'Technician' : 'User'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {istechnician ? (
            <>
              <FeatureCard
                icon="🛠️"
                title="My Tasks"
                description="View and manage your assigned maintenance tasks."
                color="yellow"
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
              />
              <FeatureCard
                icon="📂"
                title="My Requests"
                description="Track the status of your submitted requests."
                color="blue"
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
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }) {
  const accent = color === 'yellow'
    ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
    : 'bg-blue-50 border-blue-200 hover:border-blue-400'

  return (
    <div className={`rounded-lg border p-5 transition duration-200 cursor-pointer shadow-sm hover:shadow-md ${accent}`}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-base font-bold text-textPrimary mb-1">{title}</h3>
      <p className="text-sm text-textSecondary">{description}</p>
    </div>
  )
}

export default Dashboard
