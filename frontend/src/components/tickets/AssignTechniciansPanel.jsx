import { useEffect, useMemo, useState } from 'react'
import adminService from '../../services/adminService'
import ticketService from '../../services/ticketService'

function AssignTechniciansPanel({ ticketId, technicians = [], onAssigned }) {
  const [localTechnicians, setLocalTechnicians] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [priority, setPriority] = useState('')
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
    const value = event.target.value
    setSelectedIds(value ? [value] : [])
  }

  const handleAssign = async () => {
    setError('')
    
    // Allow saving priority only without requiring selected technicians if priority is selected
    if (!ticketId) return
    if (selectedIds.length === 0 && !priority) {
      setError('Please select a technician or priority.')
      return
    }

    try {
      setAssigning(true)
      if (selectedIds.length > 0) {
        await ticketService.assignTicket(ticketId, selectedIds, priority)
      } else if (priority) {
        // Just update priority if no technician is selected
        await ticketService.updateTicketPriority(ticketId, priority)
      }
      setSelectedIds([])
      setPriority('')
      if (onAssigned) onAssigned()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update ticket.')
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
        value={selectedIds[0] || ''}
        onChange={onSelectChange}
        className="w-full border border-borderColor rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        disabled={loadingUsers || assigning}
      >
        <option value="">-- Select a technician --</option>
        {availableTechnicians.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.name} ({tech.email})
          </option>
        ))}
      </select>

      {selectedIds.length > 0 && (
        <p className="text-[11px] text-textSecondary mt-2 mb-2">
          Selected: {availableTechnicians.find(t => t.id === selectedIds[0])?.name || 'Unknown'}
        </p>
      )}

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="w-full border border-borderColor rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 mt-2"
        disabled={loadingUsers || assigning}
      >
        <option value="">-- No Priority Change --</option>
        <option value="LOW">LOW</option>
        <option value="MEDIUM">MEDIUM</option>
        <option value="HIGH">HIGH</option>
        <option value="IMMEDIATE">IMMEDIATE</option>
      </select>

      <button
        type="button"
        onClick={handleAssign}
        disabled={assigning || loadingUsers || (selectedIds.length === 0 && !priority)}
        className="mt-3 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {assigning ? 'Saving...' : (selectedIds.length > 0 ? 'Assign & Save' : 'Update Priority')}
      </button>
    </div>
  )
}

export default AssignTechniciansPanel

