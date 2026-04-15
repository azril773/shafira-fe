import api from './api'

export const purchaseService = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  updateStatus: (id, data) => api.patch(`/purchases/${id}/status`, data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
}
