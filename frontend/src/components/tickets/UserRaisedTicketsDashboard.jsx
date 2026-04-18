import { useEffect, useState } from 'react'
import ticketService from '../../services/ticketService'
import { useCountdownTimer } from '../../hooks/useCountdownTimer'

const statusBadgeClass = (status) => {
  const map = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-slate-200 text-slate-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-red-600 text-white',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function UserRaisedTicketsDashboard() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { timeRemaining } = useCountdownTimer(
    tickets,
    (ticket) => ticket.deadline
  )

  useEffect(() => {
    let mounted = true

    const fetchMyTickets = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await ticketService.getMyTickets()
        if (mounted) setTickets(response.data || [])
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.error || 'Failed to load your tickets.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchMyTickets()
    const intervalId = setInterval(fetchMyTickets, 6000)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="bg-white border border-borderColor rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-textPrimary">My Raised Tickets</h2>
        <p className="text-sm text-textSecondary mt-1">
          Track the latest status updates for your submitted requests.
        </p>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-textSecondary">Loading your tickets...</p>
      ) : tickets.length === 0 ? (
        <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
          You have not raised any tickets yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="border border-borderColor rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-textPrimary">{ticket.title}</p>
                  <p className="text-xs text-textSecondary">
                    Created: {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {['OPEN', 'IN_PROGRESS'].includes(ticket.status) && timeRemaining[ticket.id] && (
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        timeRemaining[ticket.id].expired
                          ? 'bg-red-600 text-white'
                          : timeRemaining[ticket.id].critical
                          ? 'bg-orange-600 text-white animate-pulse'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {timeRemaining[ticket.id].expired ? '⏱ EXPIRED' : timeRemaining[ticket.id].text}
                    </span>
                  )}
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass(
                    timeRemaining[ticket.id]?.expired && ['OPEN', 'IN_PROGRESS'].includes(ticket.status) ? 'EXPIRED' : ticket.status
                  )}`}>
                    {timeRemaining[ticket.id]?.expired && ['OPEN', 'IN_PROGRESS'].includes(ticket.status) ? 'EXPIRED' : ticket.status}
                  </span>
                </div>
              </div>

              {ticket.description && (
                <p className="text-xs text-textSecondary mb-2">{ticket.description}</p>
              )}

              <div className="text-xs text-textSecondary">
                {ticket.assignedTechnicians?.length ? (
                  <div className="space-y-1">
                    {ticket.assignedTechnicians.map((tech) => (
                      <div key={`${ticket.id}-${tech.assignmentId || tech.technicianId}`}>
                        <span>
                          {tech.name || tech.email || tech.technicianId} ({tech.assignmentStatus || 'OPEN'})
                        </span>
                        {tech.rejectionReason && (
                          <div className="text-red-600 mt-0.5">
                            Rejection reason: {tech.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span>No technician assigned yet.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserRaisedTicketsDashboard

