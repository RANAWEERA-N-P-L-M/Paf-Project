import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import TechnicianTaskDashboard from '../components/tickets/TechnicianTaskDashboard'

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

  const handleGoBack = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-bgLight">
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

export default TechnicianTasksPage

