import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import TechnicianTaskDashboard from '../components/tickets/TechnicianTaskDashboard'
import NotificationBell from '../components/NotificationBell'

function TechnicianTasksPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const role = authService.getRole()
    if (!role) {
      navigate('/login', { replace: true })
      return
    }
    if (role !== 'TECHNICIAN' && role !== 'ADMIN') {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  const handleGoBack = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-bgLight">
      <nav className="bg-primary text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">UniCore — My Tasks</h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="px-3 sm:px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-md hover:bg-hoverGray transition duration-200 active:scale-95"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button
          type="button"
          onClick={handleGoBack}
          className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition-colors"
        >
          ← Back to Dashboard
        </button>
        <TechnicianTaskDashboard />
      </main>
    </div>
  )
}
}

export default TechnicianTasksPage
