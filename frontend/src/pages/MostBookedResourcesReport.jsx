import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import bookingService from '../services/bookingService'
import catalogueService from '../services/catalogueService'

function MostBookedResourcesReport() {
  const navigate = useNavigate()
  const [reportRows, setReportRows] = useState([])
  const [leastUsedResources, setLeastUsedResources] = useState([])
  const [mostBookedByType, setMostBookedByType] = useState([])
  const [trendPoints, setTrendPoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedAt, setGeneratedAt] = useState('')

  const generateReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [mostBookedResponse, allBookingsResponse, cataloguesResponse] = await Promise.all([
        bookingService.getMostBookedResources(),
        bookingService.getAllBookings(),
        catalogueService.getCatalogues(),
      ])

      const allBookings = allBookingsResponse.data || []
      const catalogues = cataloguesResponse.data || []
      const approvedBookings = allBookings.filter((booking) => booking.status === 'APPROVED')

      const bookingCountByFacilityId = approvedBookings.reduce((accumulator, booking) => {
        const key = booking.facilityId || ''
        if (!key) {
          return accumulator
        }
        accumulator[key] = (accumulator[key] || 0) + 1
        return accumulator
      }, {})

      const bookingCountByFacilityName = approvedBookings.reduce((accumulator, booking) => {
        const key = (booking.facilityName || '').trim()
        if (!key) {
          return accumulator
        }
        accumulator[key] = (accumulator[key] || 0) + 1
        return accumulator
      }, {})

      const leastUsed = catalogues
        .map((catalogue) => {
          const catalogueId = catalogue.id || catalogue._id || ''
          const catalogueName = catalogue.name || 'Unknown Resource'
          const directCount = catalogueId ? (bookingCountByFacilityId[catalogueId] || 0) : 0
          const fallbackCount = bookingCountByFacilityName[catalogueName] || 0

          return {
            key: catalogueId || catalogueName,
            name: catalogueName,
            count: directCount || fallbackCount,
          }
        })
        .sort((left, right) => {
          if (left.count !== right.count) {
            return left.count - right.count
          }
          return left.name.localeCompare(right.name)
        })
        .slice(0, 5)

      const facilityTypeById = catalogues.reduce((accumulator, catalogue) => {
        const catalogueId = catalogue.id || catalogue._id || ''
        if (catalogueId) {
          accumulator[catalogueId] = catalogue.type || 'Unknown Type'
        }
        return accumulator
      }, {})

      const facilityTypeByName = catalogues.reduce((accumulator, catalogue) => {
        const name = (catalogue.name || '').trim()
        if (name) {
          accumulator[name] = catalogue.type || 'Unknown Type'
        }
        return accumulator
      }, {})

      const typeCounts = approvedBookings.reduce((accumulator, booking) => {
        const typeFromId = booking.facilityId ? facilityTypeById[booking.facilityId] : ''
        const typeFromName = (booking.facilityName || '').trim()
          ? facilityTypeByName[(booking.facilityName || '').trim()]
          : ''
        const resolvedType = typeFromId || typeFromName || 'Unknown Type'

        accumulator[resolvedType] = (accumulator[resolvedType] || 0) + 1
        return accumulator
      }, {})

      const byType = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((left, right) => {
          if (left.count !== right.count) {
            return right.count - left.count
          }
          return left.type.localeCompare(right.type)
        })

      const formatDateKey = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const bookingCountsByDate = approvedBookings.reduce((accumulator, booking) => {
        const key = booking.bookingDate || ''
        if (!key) {
          return accumulator
        }
        accumulator[key] = (accumulator[key] || 0) + 1
        return accumulator
      }, {})

      const trend = Array.from({ length: 7 }, (_, index) => {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - (6 - index))

        const key = formatDateKey(date)
        return {
          dateKey: key,
          label: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
          count: bookingCountsByDate[key] || 0,
        }
      })

      setReportRows(mostBookedResponse.data || [])
      setLeastUsedResources(leastUsed)
      setMostBookedByType(byType)
      setTrendPoints(trend)
      setGeneratedAt(new Date().toLocaleString())
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout()
        navigate('/login', { replace: true })
        return
      }
      setError('Unable to generate report right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (authService.getRole() !== 'ADMIN') {
      navigate('/login', { replace: true })
      return
    }
    generateReport()
  }, [navigate, generateReport])

  const topCount = reportRows[0]?.bookingCount || 0
  const leastUsedTopCount = leastUsedResources[leastUsedResources.length - 1]?.count || 0
  const typeTopCount = mostBookedByType[0]?.count || 0
  const trendTopCount = trendPoints.reduce((max, point) => Math.max(max, point.count), 0)

  return (
    <div className="min-h-screen bg-bgLight px-4 sm:px-6 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-borderColor rounded-2xl p-5 sm:p-6 shadow-sm mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-textPrimary">Most Booked Resources Report</h1>
              <p className="text-sm text-textSecondary mt-1">
                Generate and review the top resources ranked by approved booking count.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-4 py-2 border border-borderColor text-textSecondary text-sm font-semibold rounded-lg hover:bg-hoverGray transition"
              >
                Back to Admin
              </button>
              <button
                type="button"
                onClick={generateReport}
                disabled={loading}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? 'Generating...' : 'Refresh Report'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </div>
        )}

        {generatedAt && (
          <div className="space-y-5">
            <div className="bg-white border border-borderColor rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-textPrimary">Generated Results</h2>
                  <p className="text-xs text-textSecondary">Generated at {generatedAt}</p>
                </div>
                <span className="text-xs font-semibold text-textSecondary bg-slate-50 border border-borderColor rounded-full px-3 py-1">
                  Top {reportRows.length}
                </span>
              </div>

              {reportRows.length === 0 ? (
                <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
                  No approved bookings available for this report.
                </div>
              ) : (
                <div className="space-y-3">
                  {reportRows.map((resource, index) => {
                    const width = topCount > 0
                      ? Math.max(12, Math.round((resource.bookingCount / topCount) * 100))
                      : 0

                    return (
                      <div key={`${resource.facilityId || resource.facilityName}-${index}`} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="font-semibold text-textPrimary truncate">
                              {index + 1}. {resource.facilityName || 'Unknown Resource'}
                            </p>
                            <p className="text-xs text-textSecondary">
                              {resource.bookingCount} approved booking{resource.bookingCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary">{resource.bookingCount}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-borderColor rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-textPrimary">Least Used Resources</h3>
                    <p className="text-xs text-textSecondary">Bottom resources based on approved booking count.</p>
                  </div>
                  <span className="text-xs font-semibold text-textSecondary bg-slate-50 border border-borderColor rounded-full px-3 py-1">
                    Bottom {leastUsedResources.length}
                  </span>
                </div>

                {leastUsedResources.length === 0 ? (
                  <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
                    No resources available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leastUsedResources.map((resource, index) => {
                      const width = leastUsedTopCount > 0
                        ? Math.max(12, Math.round((resource.count / leastUsedTopCount) * 100))
                        : 12

                      return (
                        <div key={`${resource.key}-${index}`} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <p className="font-semibold text-textPrimary truncate">
                              {index + 1}. {resource.name}
                            </p>
                            <span className="text-sm font-semibold text-primary">{resource.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white border border-borderColor rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-textPrimary">Most Booked by Type</h3>
                    <p className="text-xs text-textSecondary">Approved bookings aggregated by facility type.</p>
                  </div>
                </div>

                {mostBookedByType.length === 0 ? (
                  <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
                    No type data available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mostBookedByType.map((item) => {
                      const width = typeTopCount > 0
                        ? Math.max(12, Math.round((item.count / typeTopCount) * 100))
                        : 0

                      return (
                        <div key={item.type} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <p className="font-semibold text-textPrimary truncate">{item.type}</p>
                            <span className="text-sm font-semibold text-primary">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-borderColor rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-textPrimary">Trend View (Last 7 Days)</h3>
                  <p className="text-xs text-textSecondary">Daily approved booking volume trend.</p>
                </div>
              </div>

              {trendPoints.length === 0 ? (
                <div className="text-sm text-textSecondary bg-slate-50 border border-borderColor rounded-lg p-3">
                  No trend data available.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {trendPoints.map((point) => {
                    const width = trendTopCount > 0
                      ? Math.max(10, Math.round((point.count / trendTopCount) * 100))
                      : 10

                    return (
                      <div key={point.dateKey} className="border border-borderColor rounded-xl p-3 bg-slate-50">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-xs font-semibold text-textSecondary">{point.label}</p>
                          <span className="text-sm font-bold text-primary">{point.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white border border-borderColor overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MostBookedResourcesReport