import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import authService from '../services/authService'
import bookingService from '../services/bookingService'
import catalogueService from '../services/catalogueService'
import InputField from '../components/InputField'

function BookingForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { facilityId } = useParams()

  const [facilityName, setFacilityName] = useState(location.state?.facilityName || '')
  const [catalogueLoading, setCatalogueLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: '',
  })

  useEffect(() => {
    const role = authService.getRole()
    if (!role || role === 'ADMIN') {
      navigate('/login', { replace: true })
      return
    }

    const loadFacility = async () => {
      setCatalogueLoading(true)
      setError('')
      try {
        const response = await catalogueService.getCatalogues()
        const selected = (response.data || []).find((item) => (item.id || item._id) === facilityId)

        if (!selected) {
          setError('Selected facility was not found.')
          return
        }

        setFacilityName(selected.name || location.state?.facilityName || '')
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          authService.logout()
          navigate('/login', { replace: true })
          return
        }
        setError(err.response?.data?.error || 'Failed to load facility details.')
      } finally {
        setCatalogueLoading(false)
      }
    }

    loadFacility()
  }, [facilityId, location.state?.facilityName, navigate])

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const isFacilityReady = Boolean(facilityName)

  const onChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!isFacilityReady) {
      setError('Facility details are not available for booking.')
      return
    }

    if (!form.bookingDate || !form.startTime || !form.endTime || !form.purpose.trim()) {
      setError('Please fill all required fields.')
      return
    }

    if (form.endTime <= form.startTime) {
      setError('End time must be after start time.')
      return
    }

    setSubmitting(true)
    try {
      await bookingService.createBooking({
        facilityId,
        facilityName,
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
        attendees: form.attendees ? Number(form.attendees) : null,
      })

      alert('Booking request submitted successfully.')
      navigate('/my-bookings', {
        replace: true,
        state: { message: 'Booking submitted and waiting for admin approval.' },
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to submit booking right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bgLight to-white">
      <nav className="bg-primary text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">UniCore</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-3 sm:px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-md hover:bg-hoverGray transition duration-200"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/my-bookings')}
            className="px-3 sm:px-4 py-1.5 bg-white text-primary font-semibold text-sm rounded-md hover:bg-hoverGray transition duration-200"
          >
            My Bookings
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 border border-borderColor">
          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-textPrimary">Book Facility</h2>
            <p className="text-sm text-textSecondary mt-1">Fill in the details and submit your booking request.</p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {catalogueLoading ? (
            <p className="text-sm text-textSecondary">Loading facility...</p>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 bg-slate-50 border border-borderColor rounded-md px-3 py-2">
                  <p className="text-xs text-textSecondary">Facility</p>
                  <p className="text-sm font-semibold text-textPrimary mt-0.5">{facilityName || '-'}</p>
                </div>

                <div className="sm:col-span-2 bg-slate-50 border border-borderColor rounded-md px-3 py-2">
                  <p className="text-xs text-textSecondary">Facility ID</p>
                  <p className="text-sm font-semibold text-textPrimary mt-0.5 break-all">{facilityId}</p>
                </div>

                <InputField
                  label="Date"
                  type="date"
                  value={form.bookingDate}
                  onChange={onChange('bookingDate')}
                  required
                  name="bookingDate"
                  min={today}
                />

                <InputField
                  label="Purpose"
                  type="text"
                  value={form.purpose}
                  onChange={onChange('purpose')}
                  placeholder="Workshop, seminar, lab session"
                  required
                  name="purpose"
                />

                <InputField
                  label="Start Time"
                  type="time"
                  value={form.startTime}
                  onChange={onChange('startTime')}
                  required
                  name="startTime"
                />

                <InputField
                  label="End Time"
                  type="time"
                  value={form.endTime}
                  onChange={onChange('endTime')}
                  required
                  name="endTime"
                />

                <InputField
                  label="Attendees (Optional)"
                  type="number"
                  value={form.attendees}
                  onChange={onChange('attendees')}
                  placeholder="e.g. 25"
                  name="attendees"
                  min="1"
                />
              </div>

              <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 border border-borderColor text-textSecondary text-sm font-semibold rounded-md hover:bg-hoverGray transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isFacilityReady}
                  className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-60 transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

export default BookingForm
