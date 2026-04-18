import { useState } from 'react'

function RejectTaskModal({ isOpen, submitting, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleClose = () => {
    setReason('')
    setError('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!reason.trim()) {
      setError('Rejection reason is required.')
      return
    }

    await onSubmit(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-borderColor shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-textPrimary">Reject Task</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-sm font-semibold text-textSecondary hover:text-textPrimary"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-semibold text-textSecondary mb-1">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            rows={4}
            placeholder="Why are you rejecting this task?"
            maxLength={1000}
          />

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-borderColor text-sm font-semibold text-textSecondary hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Reject Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RejectTaskModal
