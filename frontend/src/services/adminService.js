import axios from 'axios'
import authService from './authService'

const API_URL = 'http://localhost:8081/api/admin'

const adminService = {
  getUsers: () =>
    axios.get(`${API_URL}/users`, authService.getAuthHeader()),

  approveUser: (id) =>
    axios.put(`${API_URL}/users/${id}/approve`, {}, authService.getAuthHeader()),

  rejectUser: (id) =>
    axios.put(`${API_URL}/users/${id}/reject`, {}, authService.getAuthHeader()),

  deleteUser: (id) =>
    axios.delete(`${API_URL}/users/${id}`, authService.getAuthHeader()),

  resetPassword: (id, password) =>
    axios.put(
      `${API_URL}/users/${id}/reset-password`,
      { password },
      authService.getAuthHeader()
    ),
}

export default adminService
