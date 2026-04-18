import axios from 'axios'
import { API_BASE } from '../config/api'
import authService from './authService'

const API_URL = `${API_BASE}/bookings`

const bookingService = {
  createBooking: (data) => axios.post(API_URL, data, authService.getAuthHeader()),

  getMyBookings: () => axios.get(`${API_URL}/my`, authService.getAuthHeader()),

  getMostBookedResources: () => axios.get(`${API_URL}/report/most-booked-resources`, authService.getAuthHeader()),

  getAllBookings: () => axios.get(API_URL, authService.getAuthHeader()),

  approveBooking: (id, message) =>
    axios.put(
      `${API_URL}/${id}/approve`,
      { adminResponse: message ?? '' },
      authService.getAuthHeader()
    ),

  rejectBooking: (id, reason) =>
    axios.put(
      `${API_URL}/${id}/reject`,
      { adminResponse: reason },
      authService.getAuthHeader()
    ),

  cancelBooking: (id) => axios.put(`${API_URL}/${id}/cancel`, {}, authService.getAuthHeader()),
}

export default bookingService
