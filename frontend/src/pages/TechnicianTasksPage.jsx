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

  return (
    <div className="min-h-screen bg-bgLight">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <TechnicianTaskDashboard />
      </main>
    </div>
  )
}

export default TechnicianTasksPage

