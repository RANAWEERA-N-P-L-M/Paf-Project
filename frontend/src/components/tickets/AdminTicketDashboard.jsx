import { useCallback, useEffect, useMemo, useState } from 'react'
import ticketService from '../../services/ticketService'
import AssignTechniciansPanel from './AssignTechniciansPanel'

const STATUS_OPTIONS = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']

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

function AdminTicketDashboard({ technicians = [] }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
  })

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await ticketService.getAllTickets(filters)
      setTickets(response.data || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tickets.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTickets()
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
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Created Time</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Assigned Technicians</th>
                <th className="px-4 py-3 text-left font-semibold text-textSecondary">Action</th>
              </tr>
            </thead>
            <tbody>
              {preparedTickets.map((ticket, idx) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-borderColor align-top ${idx === preparedTickets.length - 1 ? 'border-none' : ''}`}
                >
                  <td className="px-4 py-3 text-textPrimary font-medium min-w-44">{ticket.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-textSecondary whitespace-nowrap">
                    {formatDateTime(ticket.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-textSecondary min-w-56">
                    {ticket.assignedTechnicians.length === 0 ? (
                      <span className="text-xs">Not assigned</span>
                    ) : (
                      <div className="space-y-1">
                        {ticket.assignedTechnicians.map((tech) => (
                          <div key={`${ticket.id}-${tech.technicianId}`} className="text-xs">
                            {tech.name || tech.email || tech.technicianId} ({tech.assignmentStatus || 'OPEN'})
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 min-w-64">
                    <AssignTechniciansPanel
                      ticketId={ticket.id}
                      technicians={technicians}
                      onAssigned={fetchTickets}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminTicketDashboard

