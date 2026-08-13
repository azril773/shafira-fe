import { getErrorMessage } from '../utils/utils'
import api from './api'

export async function getSuspendedCarts() {
  try {
    const response = await api.get('/suspended-carts')
    return { data: response.data, error: '' }
  } catch (error) {
    return { data: [], error: getErrorMessage(error) }
  }
}

export async function createSuspendedCart({ label, items }) {
  try {
    const response = await api.post('/suspended-carts', {
      ...(label?.trim() ? { label: label.trim() } : {}),
      items,
    })
    return { data: response.data, error: '' }
  } catch (error) {
    return { data: null, error: getErrorMessage(error) }
  }
}

export async function resumeSuspendedCart(id, currentItems) {
  try {
    const response = await api.post(`/suspended-carts/${id}/resume`, {
      ...(currentItems.length ? { currentItems } : {}),
    })
    return { data: response.data, error: '' }
  } catch (error) {
    return { data: null, error: getErrorMessage(error) }
  }
}

export async function deleteSuspendedCart(id) {
  try {
    await api.delete(`/suspended-carts/${id}`)
    return { error: '' }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}
