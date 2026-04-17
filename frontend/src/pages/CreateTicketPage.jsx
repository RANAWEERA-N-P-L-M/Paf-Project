import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import TicketCreateForm from '../components/tickets/TicketCreateForm'

function CreateTicketPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const role = authService.getRole()
    if (!role) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-bgLight">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <TicketCreateForm />
      </main>
    </div>
  )
}

export default CreateTicketPage

