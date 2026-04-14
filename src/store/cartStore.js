import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
  addItem: (product, qty = 1) => {
    const quantity = Number(qty) > 0 ? Number(qty) : 1
    const items = get().items
    const existing = items.find((i) => i.id === product.id)
    if (existing) {
      set({
        items: items.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + quantity } : i
        ),
      })
    } else {
      set({ items: [...items, { ...product, qty: quantity }] })
    }
  },
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  updateQty: (id, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter((i) => i.id !== id) })
    } else {
      set({ items: get().items.map((i) => (i.id === id ? { ...i, qty } : i)) })
    }
  },
  clearCart: () => set({ items: [] }),
  getTotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
  getCount: () =>
    get().items.reduce((sum, i) => sum + i.qty, 0),
}))
