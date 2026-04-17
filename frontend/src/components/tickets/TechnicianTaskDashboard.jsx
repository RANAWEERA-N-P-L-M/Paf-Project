import { useCallback, useEffect, useMemo, useState } from 'react'
import ticketService from '../../services/ticketService'
import useCurrentUser from '../../hooks/useCurrentUser'
import RejectTaskModal from './RejectTaskModal'

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-200 text-slate-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const normalizeAssignmentStatus = (assignment) =>
  assignment.assignmentStatus || assignment.status || 'OPEN'

const canAccept = (task) => task.status === 'OPEN' && Boolean(task.assignmentId)
const canReject = (task) =>
  (task.status === 'OPEN' || task.status === 'IN_PROGRESS') && Boolean(task.assignmentId)
const canMoveToResolved = (task) => task.status === 'IN_PROGRESS' && Boolean(task.assignmentId)
const canMoveToClosed = (task) => task.status === 'RESOLVED' && Boolean(task.assignmentId)

function TechnicianTaskDashboard() {
  const currentUser = useCurrentUser()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await ticketService.getAllTickets()
      const allTickets = response.data || []
      const taskList = []

      allTickets.forEach((ticket) => {
        const assignments = ticket.assignedTechnicians || []
        assignments.forEach((assignment) => {
          const technicianId = assignment.technicianId || assignment.id || ''
          const technicianEmail = assignment.email || ''
          const belongsToCurrentUser =
            (currentUser.id && technicianId === currentUser.id) ||
            (currentUser.email && technicianEmail === currentUser.email)

          if (!belongsToCurrentUser) return

          taskList.push({
            assignmentId: assignment.assignmentId || assignment.id || null,
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            technicianId,
            technicianName: assignment.name || assignment.email || 'Technician',
            status: normalizeAssignmentStatus(assignment),
            createdAt: ticket.createdAt,
          })
        })
      })

      setTasks(taskList)
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Unable to load tasks. Current API only allows admin ticket listing.'
      )
    } finally {
      setLoading(false)
    }
  }, [currentUser.email, currentUser.id])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const noAssignmentIdCount = useMemo(
    () => tasks.filter((task) => !task.assignmentId).length,
    [tasks]
  )

  const runAction = async (handler) => {
    try {
      setSubmitting(true)
      await handler()
      await loadTasks()
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAccept = (task) => runAction(() => ticketService.acceptTask(task.assignmentId))

  const handleRejectSubmit = async (reason) => {
    if (!selectedTask) return
    await runAction(() => ticketService.rejectTask(selectedTask.assignmentId, reason))
    setSelectedTask(null)
  }

  const handleMoveResolved = (task) =>
    runAction(() => ticketService.updateTaskStatus(task.assignmentId, 'RESOLVED'))

  const handleMoveClosed = (task) =>
    runAction(() => ticketService.updateTaskStatus(task.assignmentId, 'CLOSED'))

  return (
    <div className="bg-white border border-borderColor rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-textPrimary">My Assigned Tasks</h2>
        <p className="text-sm text-textSecondary mt-1">
          Accept or reject tasks, then move status through IN_PROGRESS, RESOLVED, and CLOSED.
        </p>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {noAssignmentIdCount > 0 && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Some tasks do not include assignment IDs from the listing API; actions are disabled for those items.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-textSecondary">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
          No assigned tasks found.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={`${task.ticketId}-${task.technicianId}`}
              className="border border-borderColor rounded-xl p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-semibold text-textPrimary">{task.ticketTitle}</p>
                  <p className="text-xs text-textSecondary">
                    Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold w-fit ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-600'}`}
                >
                  {task.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAccept(task)}
                  disabled={!canAccept(task) || submitting}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTask(task)}
                  disabled={!canReject(task) || submitting}
                  className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveResolved(task)}
                  disabled={!canMoveToResolved(task) || submitting}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Mark Resolved
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveClosed(task)}
                  disabled={!canMoveToClosed(task) || submitting}
                  className="px-3 py-1.5 rounded-md bg-slate-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RejectTaskModal
        isOpen={Boolean(selectedTask)}
        submitting={submitting}
        onClose={() => setSelectedTask(null)}
        onSubmit={handleRejectSubmit}
      />
    </div>
  )
}

export default TechnicianTaskDashboard
