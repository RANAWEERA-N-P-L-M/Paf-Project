import axios from 'axios'
import { API_BASE, BACKEND_ORIGIN } from '../config/api'
import authService from './authService'

const apiTicketBase = `${API_BASE}/tickets`
const apiAssignmentBase = `${API_BASE}/assignments`
const directTicketBase = `${BACKEND_ORIGIN}/tickets`
const directAssignmentBase = `${BACKEND_ORIGIN}/assignments`

const shouldFallbackToDirect = (error) =>
  error?.response?.status === 404 || error?.code === 'ERR_NETWORK'

const withAuth = (config = {}) => ({
  ...config,
  ...authService.getAuthHeader(),
})

const requestWithFallback = async (primaryRequest, fallbackRequest) => {
  try {
    return await primaryRequest()
  } catch (error) {
    if (!shouldFallbackToDirect(error)) {
      throw error
    }
    return fallbackRequest()
  }
}

const ticketService = {
  createTicket: (data) =>
    requestWithFallback(
      () => axios.post(apiTicketBase, data, withAuth()),
      () => axios.post(directTicketBase, data, withAuth())
    ),

  getAllTickets: (filters = {}) => {
    const params = {}

    if (filters.status) params.status = filters.status
    if (filters.fromDate) params.fromDate = new Date(filters.fromDate).toISOString()
    if (filters.toDate) params.toDate = new Date(filters.toDate).toISOString()

    return requestWithFallback(
      () => axios.get(apiTicketBase, withAuth({ params })),
      () => axios.get(directTicketBase, withAuth({ params }))
    )
  },

  assignTicket: (ticketId, technicianIds) =>
    requestWithFallback(
      () => axios.post(`${apiTicketBase}/${ticketId}/assign`, { technicianIds }, withAuth()),
      () => axios.post(`${directTicketBase}/${ticketId}/assign`, { technicianIds }, withAuth())
    ),

  acceptTask: (assignmentId) =>
    requestWithFallback(
      () => axios.put(`${apiAssignmentBase}/${assignmentId}/accept`, {}, withAuth()),
      () => axios.put(`${directAssignmentBase}/${assignmentId}/accept`, {}, withAuth())
    ),

  rejectTask: (assignmentId, reason) =>
    requestWithFallback(
      () =>
        axios.put(
          `${apiAssignmentBase}/${assignmentId}/reject`,
          { rejectionReason: reason },
          withAuth()
        ),
      () =>
        axios.put(
          `${directAssignmentBase}/${assignmentId}/reject`,
          { rejectionReason: reason },
          withAuth()
        )
    ),

  updateTaskStatus: (assignmentId, status) =>
    requestWithFallback(
      () => axios.put(`${apiAssignmentBase}/${assignmentId}/status`, { status }, withAuth()),
      () => axios.put(`${directAssignmentBase}/${assignmentId}/status`, { status }, withAuth())
    ),
}

export default ticketService

