import { create } from 'zustand'
import {
  createSuspendedCart,
  deleteSuspendedCart,
  getSuspendedCarts,
  resumeSuspendedCart,
} from '../services/suspendedCartService'

export const useCartStore = create((set, get) => ({
  items: [],
  suspended: [],
  addItem: (product, qty = 1) => {
    const quantity = Number(qty) > 0 ? Number(qty) : 1
    const items = get().items
    const price = Number(product.price) || 0
    const key = `${product.id}-${price}`
    const existing = items.find((i) => i.key === key)
    if (existing) {
      set({
        items: items.map((i) =>
          i.key === key ? { ...i, qty: i.qty + quantity } : i
        ),
      })
    } else {
      set({ items: [...items, { ...product, qty: quantity, key }] })
    }
  },
  removeItem: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
  updateQty: (key, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter((i) => i.key !== key) })
    } else {
      set({ items: get().items.map((i) => (i.key === key ? { ...i, qty } : i)) })
    }
  },
  clearCart: () => set({ items: [] }),
  getTotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
  getCount: () =>
    get().items.reduce((sum, i) => sum + i.qty, 0),
  loadSuspended: async () => {
    const { data, error } = await getSuspendedCarts()
    if (!error) set({ suspended: data })
    return { error }
  },
  suspendCurrent: async (label) => {
    const items = get().items
    if (!items.length) return { entry: null, error: '' }

    const { data, error } = await createSuspendedCart({
      label,
      items: items.map((item) => ({ ...item })),
    })
    if (error) return { entry: null, error }

    set({ suspended: [...get().suspended, data], items: [] })
    return { entry: data, error: '' }
  },
  resumeSuspended: async (id) => {
    const currentItems = get().items.map((item) => ({ ...item }))
    const { data, error } = await resumeSuspendedCart(id, currentItems)
    if (error) return { resumed: false, error }

    set({
      items: data.items.map((item) => ({ ...item })),
      suspended: data.suspended,
    })
    return { resumed: true, error: '' }
  },
  removeSuspended: async (id) => {
    const { error } = await deleteSuspendedCart(id)
    if (error) return { removed: false, error }

    set({ suspended: get().suspended.filter((entry) => entry.id !== id) })
    return { removed: true, error: '' }
  },
}))
