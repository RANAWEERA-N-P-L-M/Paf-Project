import { useCallback, useEffect, useMemo, useState } from 'react'
import ticketService from '../../services/ticketService'
import AssignTechnicianModal from './AssignTechnicianModal'
import { useCountdownTimer } from '../../hooks/useCountdownTimer'

const STATUS_OPTIONS = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'EXPIRED']
const PRIORITY_OPTIONS = ['', 'LOW', 'MEDIUM', 'HIGH', 'IMMEDIATE']

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

const toDateTimeLocal = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

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

const priorityBadgeClass = (priority) => {
  const map = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
    IMMEDIATE: 'bg-red-200 text-red-800',
  }
  return map[priority] || 'bg-gray-100 text-gray-600'
}

const slaStatusBadgeClass = (slaStatus, escalated) => {
  if (escalated) return 'bg-red-100 text-red-700'
  if (slaStatus === 'OVERDUE') return 'bg-orange-100 text-orange-700'
  return 'bg-green-100 text-green-700'
}

function AdminTicketDashboard({ technicians = [] }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    fromDate: '',
    toDate: '',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [clearing, setClearing] = useState(false)

  // Countdown timer for deadlines
  const { timeRemaining } = useCountdownTimer(
    tickets,
    (ticket) => ticket.deadline
  )

  const fetchTickets = useCallback(async (options = {}) => {
    if (!options.silent) setLoading(true)
    setError('')
    try {
      const response = await ticketService.getAllTickets(filters)
      setTickets(response.data || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tickets.')
    } finally {
      if (!options.silent) setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchTickets({ silent: true })
    }, 10000) // Update every 10 seconds to sync with countdown timer

    return () => clearInterval(intervalId)
  }, [fetchTickets])

  const onFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const preparedTickets = useMemo(
    () =>
      tickets.map((ticket) => ({
        ...ticket,
        assignedTechnicians: ticket.assignedTechnicians || [],
      })),
    [tickets]
  )

  const openAssignModal = (ticket) => {
    setSelectedTicket(ticket)
    setModalOpen(true)
  }

  const handleClearAllTickets = async () => {
    if (!window.confirm('Are you sure you want to delete ALL tickets? This action cannot be undone.')) {
      return
    }
    setClearing(true)
    setError('')
    try {
      await ticketService.clearAllTickets()
      await fetchTickets()
      alert('All tickets have been deleted successfully.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clear tickets.')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="shrink-0 flex flex-col lg:flex-row lg:items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="border border-borderColor rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status || 'ALL'} value={status}>
                {status || 'ALL'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="border border-borderColor rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority || 'ALL'} value={priority}>
                {priority || 'ALL'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">From</label>
          <input
            type="datetime-local"
            value={toDateTimeLocal(filters.fromDate)}
            onChange={(e) => onFilterChange('fromDate', e.target.value)}
            className="border border-borderColor rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">To</label>
          <input
            type="datetime-local"
            value={toDateTimeLocal(filters.toDate)}
            onChange={(e) => onFilterChange('toDate', e.target.value)}
            className="border border-borderColor rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleClearAllTickets}
          disabled={clearing || tickets.length === 0}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          {clearing ? 'Clearing...' : '🗑️ Clear All Tickets'}
        </button>
      </div>

      {error && (
        <div className="shrink-0 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
      {loading ? (
        <p className="text-sm text-textSecondary">Loading tickets...</p>
      ) : preparedTickets.length === 0 ? (
        <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
          No tickets found for selected filters.
        </div>
      ) : (
        <div className="bg-white border border-borderColor rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-borderColor">
                <th className="px-4 py-3 text-left font-semibold text-textSecondary whitespace-nowrap">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary whitespace-nowrap">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary whitespace-nowrap">SLA</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary whitespace-nowrap">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary whitespace-nowrap">Deadline</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary whitespace-nowrap">Technicians</th>
                <th className="px-4 py-3 text-center font-semibold text-textSecondary whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {preparedTickets.map((ticket, idx) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-borderColor hover:bg-slate-50 transition-colors ${
                    idx === preparedTickets.length - 1 ? 'border-none' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-textPrimary font-medium max-w-[200px]">
                    <div className="truncate" title={ticket.title}>
                      {ticket.title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${statusBadgeClass(
                        timeRemaining[ticket.id]?.expired && ['OPEN', 'IN_PROGRESS'].includes(ticket.status) ? 'EXPIRED' : ticket.status
                      )}`}
                    >
                      {timeRemaining[ticket.id]?.expired && ['OPEN', 'IN_PROGRESS'].includes(ticket.status) ? 'EXPIRED' : ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={ticket.priority || 'MEDIUM'}
                      onChange={async (e) => {
                        const newPriority = e.target.value;
                        if (newPriority === ticket.priority) return;
                        try {
                          await ticketService.updateTicketPriority(ticket.id, newPriority);
                          fetchTickets({ silent: true });
                        } catch (err) {
                          alert('Failed to update priority. ' + (err.response?.data?.error || ''));
                        }
                      }}
                      className={`px-2 py-1 pr-6 rounded-full text-xs font-bold cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-opacity hover:opacity-90 ${priorityBadgeClass(ticket.priority)}`}
                      title="Click to change ticket priority"
                    >
                      <option className="bg-white text-slate-800" value="LOW">LOW</option>
                      <option className="bg-white text-slate-800" value="MEDIUM">MEDIUM</option>
                      <option className="bg-white text-slate-800" value="HIGH">HIGH</option>
                      <option className="bg-white text-slate-800" value="IMMEDIATE">IMMEDIATE</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {ticket.slaStatus ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${slaStatusBadgeClass(
                          ticket.slaStatus,
                          ticket.escalated
                        )}`}
                      >
                        {ticket.escalated ? '⚠️ ESC' : ticket.slaStatus === 'OVERDUE' ? '⏰ OVD' : '✓ OK'}
                      </span>
                    ) : (
                      <span className="text-xs text-textSecondary">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-textSecondary text-xs whitespace-nowrap">
                    {formatDateTime(ticket.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">
                    {timeRemaining[ticket.id] ? (
                      <span className={timeRemaining[ticket.id].className}>
                        {timeRemaining[ticket.id].text}
                      </span>
                    ) : ticket.deadline ? (
                      <span className="text-gray-600">{formatDateTime(ticket.deadline)}</span>
                    ) : (
                      <span className="text-textSecondary">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-textSecondary min-w-[120px]">
                    {ticket.assignedTechnicians.length === 0 ? (
                      <span className="text-xs text-slate-400">Not assigned</span>
                    ) : (
                      <div className="space-y-0.5">
                        {ticket.assignedTechnicians.slice(0, 2).map((tech) => (
                          <div key={`${ticket.id}-${tech.technicianId}`} className="text-xs">
                            <span className="block truncate max-w-[120px]" title={tech.name || tech.email}>
                              {tech.name || tech.email || 'Unknown'}
                            </span>
                            {tech.rejectionReason && (
                              <div className="text-[11px] text-red-600 mt-0.5">
                                Rejected: {tech.rejectionReason}
                              </div>
                            )}
                          </div>
                        ))}
                        {ticket.assignedTechnicians.length > 2 && (
                          <div className="text-xs text-slate-500 font-medium">
                            +{ticket.assignedTechnicians.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openAssignModal(ticket)}
                      className="px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      <AssignTechnicianModal
        isOpen={modalOpen}
        ticket={selectedTicket}
        technicians={technicians}
        onClose={() => setModalOpen(false)}
        onAssigned={fetchTickets}
      />
    </div>
  )
}

export default AdminTicketDashboard
