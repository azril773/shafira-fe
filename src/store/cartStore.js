import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
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
}))
