import { useState } from 'react'
import AssignTechniciansPanel from './AssignTechniciansPanel'

function AssignTechnicianModal({ isOpen, ticket, technicians, onClose, onAssigned }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 border-b border-borderColor px-6 py-4 bg-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-textPrimary">Assign Technician</h2>
              <p className="text-xs text-textSecondary mt-1 truncate">{ticket?.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-textSecondary hover:text-textPrimary text-xl font-bold ml-2"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <AssignTechniciansPanel
            ticketId={ticket?.id}
            technicians={technicians}
            onAssigned={() => {
              onAssigned()
              onClose()
            }}
          />
        </div>

        <div className="sticky bottom-0 border-t border-borderColor px-6 py-3 flex justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-textSecondary bg-white border border-borderColor hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignTechnicianModal
