import { useEffect, useMemo, useState } from 'react'
import adminService from '../../services/adminService'
import ticketService from '../../services/ticketService'

function AssignTechniciansPanel({ ticketId, technicians = [], onAssigned }) {
  const [localTechnicians, setLocalTechnicians] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')

  const availableTechnicians = useMemo(() => {
    const source = technicians.length > 0 ? technicians : localTechnicians
    return source.filter((user) => user.role === 'TECHNICIAN' && user.status === 'APPROVED')
  }, [technicians, localTechnicians])

  useEffect(() => {
    let mounted = true
    if (technicians.length > 0) return undefined

    const loadUsers = async () => {
      try {
        setLoadingUsers(true)
        const response = await adminService.getUsers()
        if (mounted) {
          setLocalTechnicians(response.data || [])
        }
      } catch {
        if (mounted) setError('Failed to load technicians.')
      } finally {
        if (mounted) setLoadingUsers(false)
      }
    }

    loadUsers()
    return () => {
      mounted = false
    }
  }, [technicians])

  const onSelectChange = (event) => {
    const values = Array.from(event.target.selectedOptions).map((opt) => opt.value)
    setSelectedIds(values)
  }

  const handleAssign = async () => {
    setError('')
    if (!ticketId || selectedIds.length === 0) return

    try {
      setAssigning(true)
      await ticketService.assignTicket(ticketId, selectedIds)
      setSelectedIds([])
      if (onAssigned) onAssigned()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign technicians.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="border border-borderColor rounded-lg p-3 bg-slate-50">
      <p className="text-xs font-semibold text-textSecondary mb-2">Assign Technicians</p>

      {error && (
        <div className="mb-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <select
        multiple
        value={selectedIds}
        onChange={onSelectChange}
        className="w-full border border-borderColor rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        size={Math.min(4, Math.max(2, availableTechnicians.length || 2))}
        disabled={loadingUsers || assigning}
      >
        {availableTechnicians.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.name} ({tech.email})
          </option>
        ))}
      </select>

      {selectedIds.length > 0 && (
        <p className="text-[11px] text-textSecondary mt-2">
          Selected: {selectedIds.length} technician{selectedIds.length !== 1 ? 's' : ''}
        </p>
      )}

      <button
        type="button"
        onClick={handleAssign}
        disabled={assigning || loadingUsers || selectedIds.length === 0}
        className="mt-2 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {assigning ? 'Assigning...' : 'Assign'}
      </button>
    </div>
  )
}

export default AssignTechniciansPanel

