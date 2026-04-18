import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import bookingService from '../services/bookingService'

function MyBookings() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialized = useRef(false)

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.message || '')
  const [actionId, setActionId] = useState('')

  const fetchMyBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await bookingService.getMyBookings()
      setBookings(response.data || [])
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout()
        navigate('/login', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const role = authService.getRole()
    if (!role || role === 'ADMIN') {
      navigate('/login', { replace: true })
      return
    }

    fetchMyBookings()
  }, [fetchMyBookings, navigate])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return

    setActionId(id)
    setError('')
    setMessage('')
    try {
      await bookingService.cancelBooking(id)
      setMessage('Booking cancelled successfully.')
      await fetchMyBookings()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking.')
    } finally {
      setActionId('')
    }
  }

  const statusBadge = (status) => {
    const map = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-700',
    }
    return map[status] ?? 'bg-gray-100 text-gray-700'
  }

  const canCancel = (status) => status === 'PENDING' || status === 'APPROVED'

  return (
    <div className="min-h-screen bg-gradient-to-b from-bgLight to-white">
      <nav className="bg-primary text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">UniCore</h1>
          <span className="hidden sm:inline text-xs px-2.5 py-1 rounded-full bg-white/15">My Bookings</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-3 sm:px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-md hover:bg-hoverGray transition"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              authService.logout()
              navigate('/login')
            }}
            className="px-3 sm:px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-md hover:bg-hoverGray transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section className="bg-white rounded-lg shadow-md border border-borderColor p-4 sm:p-6">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-textPrimary">My Bookings</h2>
              <p className="text-sm text-textSecondary mt-1">Track status and cancel active bookings when needed.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-fit px-3 py-1.5 rounded-lg border border-borderColor text-sm font-semibold text-textSecondary hover:bg-hoverGray transition"
            >
              Back to dashboard
            </button>
          </div>

          {message && (
            <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-textSecondary">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-4">
              You do not have any bookings yet.
            </p>
          ) : (
            <div className="space-y-3">
              {bookings.map((item) => (
                <div key={item.id} className="border border-borderColor rounded-lg p-4 hover:bg-slate-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-textPrimary">{item.facilityName}</p>
                      <p className="text-sm text-textSecondary mt-1">
                        {item.bookingDate} | {item.startTime} - {item.endTime}
                      </p>
                    </div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-sm text-textSecondary mt-3">
                    <span className="font-semibold text-textPrimary">Purpose:</span> {item.purpose}
                  </p>

                  {item.attendees ? (
                    <p className="text-sm text-textSecondary mt-1">
                      <span className="font-semibold text-textPrimary">Attendees:</span> {item.attendees}
                    </p>
                  ) : null}

                  {Array.isArray(item.selectedEquipments) && item.selectedEquipments.length > 0 ? (
                    <p className="text-sm text-textSecondary mt-1">
                      <span className="font-semibold text-textPrimary">Equipments:</span>{' '}
                      {item.selectedEquipments.join(', ')}
                    </p>
                  ) : null}

                  {item.status === 'REJECTED' && item.adminResponse && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mt-3">
                      <span className="font-semibold">Reason:</span> {item.adminResponse}
                    </p>
                  )}

                  {canCancel(item.status) && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => handleCancel(item.id)}
                        disabled={actionId === item.id}
                        className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold rounded-md disabled:opacity-60 transition"
                      >
                        {actionId === item.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default MyBookings
