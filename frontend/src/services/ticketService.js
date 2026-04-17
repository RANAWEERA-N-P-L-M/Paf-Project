import axios from 'axios'
import { API_BASE } from '../config/api'
import authService from './authService'

const ticketBase = '/tickets'
const assignmentBase = '/assignments'
const apiTicketBase = `${API_BASE}/tickets`
const apiAssignmentBase = `${API_BASE}/assignments`

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
      () => axios.post(ticketBase, data, withAuth()),
      () => axios.post(apiTicketBase, data, withAuth())
    ),

  getAllTickets: (filters = {}) => {
    const params = {}

    if (filters.status) params.status = filters.status
    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate)
      if (!Number.isNaN(fromDate.getTime())) {
        params.fromDate = fromDate.toISOString()
      }
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate)
      if (!Number.isNaN(toDate.getTime())) {
        params.toDate = toDate.toISOString()
      }
    }

    return requestWithFallback(
      () => axios.get(ticketBase, withAuth({ params })),
      () => axios.get(apiTicketBase, withAuth({ params }))
    )
  },

  getMyTickets: () =>
    requestWithFallback(
      () => axios.get(`${ticketBase}/my`, withAuth()),
      () => axios.get(`${apiTicketBase}/my`, withAuth())
    ),

  getMyAssignments: () =>
    requestWithFallback(
      () => axios.get(`${assignmentBase}/my`, withAuth()),
      () => axios.get(`${apiAssignmentBase}/my`, withAuth())
    ),

  assignTicket: (ticketId, technicianIds) =>
    requestWithFallback(
      () => axios.post(`${ticketBase}/${ticketId}/assign`, { technicianIds }, withAuth()),
      () => axios.post(`${apiTicketBase}/${ticketId}/assign`, { technicianIds }, withAuth())
    ),

  acceptTask: (assignmentId) =>
    requestWithFallback(
      () => axios.put(`${assignmentBase}/${assignmentId}/accept`, {}, withAuth()),
      () => axios.put(`${apiAssignmentBase}/${assignmentId}/accept`, {}, withAuth())
    ),

  rejectTask: (assignmentId, reason) =>
    requestWithFallback(
      () =>
        axios.put(
          `${assignmentBase}/${assignmentId}/reject`,
          { rejectionReason: reason },
          withAuth()
        ),
      () =>
        axios.put(
          `${apiAssignmentBase}/${assignmentId}/reject`,
          { rejectionReason: reason },
          withAuth()
        )
    ),

  updateTaskStatus: (assignmentId, status) =>
    requestWithFallback(
      () => axios.put(`${assignmentBase}/${assignmentId}/status`, { status }, withAuth()),
      () => axios.put(`${apiAssignmentBase}/${assignmentId}/status`, { status }, withAuth())
    ),
}

export default ticketService
