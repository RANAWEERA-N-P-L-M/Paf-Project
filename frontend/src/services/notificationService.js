import axios from 'axios'
import { API_BASE } from '../config/api'
import authService from './authService'

const notificationService = {
  getNotifications() {
    return axios.get(`${API_BASE}/notifications`, authService.getAuthHeader())
  },

  getUnreadCount() {
    return axios.get(`${API_BASE}/notifications/unread-count`, authService.getAuthHeader())
  },

  markRead(id) {
    return axios.put(`${API_BASE}/notifications/${id}/read`, {}, authService.getAuthHeader())
  },

  markAllRead() {
    return axios.put(`${API_BASE}/notifications/read-all`, {}, authService.getAuthHeader())
  },
}

export default notificationService
