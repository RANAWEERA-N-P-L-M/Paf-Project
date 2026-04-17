import { useState } from 'react'
import ticketService from '../../services/ticketService'

function TicketCreateForm() {
  const [form, setForm] = useState({ title: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (!form.title.trim() || !form.description.trim()) {
      setErrorMessage('Title and description are required.')
      return
    }

    try {
      setSubmitting(true)
      await ticketService.createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
      })
      setForm({ title: '', description: '' })
      setSuccessMessage('Ticket created successfully.')
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Failed to create ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-borderColor rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-textPrimary">Create Ticket</h2>
        <p className="text-sm text-textSecondary mt-1">Submit a new maintenance incident.</p>
      </div>

      {successMessage && (
        <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Water leak in lecture hall"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Describe the issue clearly..."
            rows={4}
            maxLength={2000}
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TicketCreateForm

