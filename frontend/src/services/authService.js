import axios from 'axios'
import { API_BASE } from '../config/api'

const API_URL = API_BASE

const authService = {
  login: (email, password) =>
    axios.post(`${API_URL}/auth/login`, { email, password }),

  register: (name, email, password, role) =>
    axios.post(`${API_URL}/auth/register`, { name, email, password, role }),

  oauth2Complete: (email, name, role) =>
    axios.post(`${API_URL}/auth/oauth2/complete`, { email, name, role }),

  saveAuth: (token, role) => {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
  },

  getToken: () => localStorage.getItem('token'),

  getRole: () => localStorage.getItem('role'),

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
  },

  getAuthHeader: () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  }),
}

export default authService
