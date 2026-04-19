import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ticketService from '../../services/ticketService'
import RejectTaskModal from './RejectTaskModal'
import { useCountdownTimer } from '../../hooks/useCountdownTimer'

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-200 text-slate-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-red-600 text-white',
}

const PRIORITY_COLORS = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
  IMMEDIATE: 'bg-red-200 text-red-800',
}

const normalizeAssignmentStatus = (assignment) =>
  assignment.assignmentStatus || assignment.status || 'OPEN'

const canAccept = (task) => task.status === 'OPEN' && Boolean(task.assignmentId)
const canReject = (task) =>
  (task.status === 'OPEN' || task.status === 'IN_PROGRESS') && Boolean(task.assignmentId)
const canMoveToResolved = (task) => task.status === 'IN_PROGRESS' && Boolean(task.assignmentId)
const canMoveToClosed = (task) => task.status === 'RESOLVED' && Boolean(task.assignmentId)

function TechnicianTaskDashboard() {
  const initialized = useRef(false)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { timeRemaining } = useCountdownTimer(
    tasks,
    (task) => task.deadline
  )



  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await ticketService.getMyAssignments()
      const taskList = (response.data || []).map((task) => ({
        assignmentId: task.assignmentId || null,
        ticketId: task.ticketId || '',
        ticketTitle: task.ticketTitle || 'Untitled Ticket',
        status: normalizeAssignmentStatus(task),
        priority: task.priority || 'MEDIUM',
        deadline: task.deadline,
        slaStatus: task.slaStatus,
        escalated: task.escalated || false,
        createdAt: task.createdAt,
      }))
      setTasks(taskList)
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to load assigned tasks right now.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
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
    <div className="bg-gradient-to-b from-slate-50 to-white border border-borderColor rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-base shrink-0">🛠️</span>
              My Assigned Tasks
            </h2>
            <p className="text-sm text-textSecondary mt-1 ml-10">
              Accept or reject tasks, then move status through IN_PROGRESS, RESOLVED, and CLOSED.
            </p>
          </div>
          {!loading && tasks.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700">
                {tasks.filter(t => t.status === 'OPEN').length} Open
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700">
                {tasks.filter(t => t.status === 'IN_PROGRESS').length} In Progress
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700">
                {tasks.filter(t => t.status === 'RESOLVED').length} Resolved
              </span>
            </div>
          )}
        </div>
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
        <div className="flex items-center justify-center py-14 text-textSecondary text-sm gap-2">
          <span className="animate-spin text-base">⏳</span> Loading tasks…
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">🛠️</div>
          <p className="text-textPrimary font-semibold">No assigned tasks found.</p>
          <p className="text-sm text-textSecondary">When tasks are assigned to you, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const timeInfo = timeRemaining[task.ticketId]
            const isExpired = timeInfo?.expired || false
            const isCritical = timeInfo?.critical || false
            const isEffectivelyExpired = isExpired && ['OPEN', 'IN_PROGRESS'].includes(task.status)

            const priorityBorderMap = {
              LOW: 'border-l-4 border-l-green-400',
              MEDIUM: 'border-l-4 border-l-yellow-400',
              HIGH: 'border-l-4 border-l-orange-400',
              IMMEDIATE: 'border-l-4 border-l-red-500',
            }
            const priorityBorder = isEffectivelyExpired
              ? 'border-l-4 border-l-red-500'
              : (priorityBorderMap[task.priority] || 'border-l-4 border-l-slate-300')
            
            return (
              <div
                key={task.assignmentId || task.ticketId}
                className={`border rounded-xl p-4 ${priorityBorder} ${isEffectivelyExpired ? 'border-red-300 bg-red-50/60' : 'border-borderColor bg-white hover:shadow-sm'} transition-shadow duration-200`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-textPrimary">{task.ticketTitle}</p>
                    <p className="text-xs text-textSecondary mt-1">
                      Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}
                    </p>
                    {task.deadline && (
                      <p className="text-xs text-textSecondary mt-1">
                        Deadline: {new Date(task.deadline).toLocaleString()}
                      </p>
                    )}
                    {task.deadline && ['OPEN', 'IN_PROGRESS'].includes(task.status) && (
                      <div className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-fit ${isEffectivelyExpired ? 'bg-red-100 border border-red-300' : isCritical ? 'bg-orange-50 border border-orange-300' : 'bg-emerald-50 border border-emerald-200'}`}>
                        <span className="text-xs font-medium text-gray-500">⏱ Time left:</span>
                        <span className={`text-sm font-bold tabular-nums ${isEffectivelyExpired ? 'text-red-600' : isCritical ? 'text-orange-600 animate-pulse' : 'text-emerald-700'}`}>
                          {timeInfo ? (isEffectivelyExpired ? 'EXPIRED' : timeInfo.text) : '—'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${isEffectivelyExpired ? STATUS_COLORS['EXPIRED'] : (STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-600')}`}
                    >
                      {isEffectivelyExpired ? 'EXPIRED' : task.status}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-borderColor mt-1">
                  <button
                    type="button"
                    onClick={() => handleAccept(task)}
                    disabled={!canAccept(task) || submitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    ✓ Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    disabled={!canReject(task) || submitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ✕ Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveResolved(task)}
                    disabled={!canMoveToResolved(task) || submitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    ✔ Mark Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveClosed(task)}
                    disabled={!canMoveToClosed(task) || submitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ✓ Close
                  </button>
                </div>
              </div>
            )
          })}
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
