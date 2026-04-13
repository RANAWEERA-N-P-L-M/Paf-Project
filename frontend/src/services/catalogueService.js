import axios from 'axios'
import { API_BASE } from '../config/api'
import authService from './authService'

const API_URL = `${API_BASE}/catalogues`

const catalogueService = {
  getCatalogues: () => axios.get(API_URL, authService.getAuthHeader()),

  createCatalogue: (payload) => axios.post(API_URL, payload, authService.getAuthHeader()),

  updateCatalogue: (id, payload) => axios.put(`${API_URL}/${id}`, payload, authService.getAuthHeader()),

  deleteCatalogue: (id) => axios.delete(`${API_URL}/${id}`, authService.getAuthHeader()),
}

export default catalogueService
