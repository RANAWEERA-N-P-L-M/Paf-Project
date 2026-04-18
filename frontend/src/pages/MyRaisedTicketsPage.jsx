import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import UserRaisedTicketsDashboard from '../components/tickets/UserRaisedTicketsDashboard'

function MyRaisedTicketsPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const role = authService.getRole()
    if (!role) {
      navigate('/login', { replace: true })
      return
    }
    if (role === 'ADMIN') {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-bgLight">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <UserRaisedTicketsDashboard />
      </main>
    </div>
  )
}

export default MyRaisedTicketsPage

