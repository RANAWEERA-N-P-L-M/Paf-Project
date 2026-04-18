import { useCallback, useEffect, useMemo, useState } from 'react'
import ticketService from '../../services/ticketService'
import AssignTechnicianModal from './AssignTechnicianModal'

const STATUS_OPTIONS = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
const PRIORITY_OPTIONS = ['', 'LOW', 'MEDIUM', 'HIGH']

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
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

const priorityBadgeClass = (priority) => {
  const map = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
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
    }, 6000)

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
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

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

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
                <th className="px-4 py-3 text-left font-semibold text-textSecondary min-w-40">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary min-w-24">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary min-w-20">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary min-w-20">SLA</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary min-w-32">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary min-w-40">Technicians</th>
                <th className="px-4 py-3 text-center font-semibold text-textSecondary min-w-20">Action</th>
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
                  <td className="px-4 py-3 text-textPrimary font-medium">
                    <div className="truncate hover:text-clip" title={ticket.title}>
                      {ticket.title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${statusBadgeClass(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {ticket.priority ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${priorityBadgeClass(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    ) : (
                      <span className="text-xs text-textSecondary">-</span>
                    )}
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
                  <td className="px-4 py-3 text-textSecondary">
                    {ticket.assignedTechnicians.length === 0 ? (
                      <span className="text-xs text-slate-400">Not assigned</span>
                    ) : (
                      <div className="space-y-0.5">
                        {ticket.assignedTechnicians.slice(0, 2).map((tech) => (
                          <div key={`${ticket.id}-${tech.technicianId}`} className="text-xs">
                            <div className="flex items-center gap-1">
                              <span className="truncate">
                                {tech.name || tech.email || 'Unknown'}
                              </span>
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                                  tech.assignmentStatus === 'REJECTED'
                                    ? 'bg-red-50 text-red-700'
                                    : tech.assignmentStatus === 'RESOLVED'
                                    ? 'bg-green-50 text-green-700'
                                    : tech.assignmentStatus === 'IN_PROGRESS'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {tech.assignmentStatus}
                              </span>
                            </div>
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
