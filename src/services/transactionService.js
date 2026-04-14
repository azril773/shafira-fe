import api from './api'

export const transactionService = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  void: (id) => api.patch(`/transactions/${id}/void`),
}
