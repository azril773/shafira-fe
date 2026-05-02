import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
  // Daftar transaksi yang ditahan (suspended). Setiap entry: { id, label, items, savedAt }
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
  // ---- Suspend / Resume ----
  suspendCurrent: (label) => {
    const items = get().items
    if (!items || items.length === 0) return null
    const id = `SUS-${Date.now()}`
    const entry = {
      id,
      label: label?.trim() || `Suspend ${new Date().toLocaleTimeString('id-ID')}`,
      items: items.map((i) => ({ ...i })),
      savedAt: new Date().toISOString(),
    }
    set({ suspended: [...get().suspended, entry], items: [] })
    return entry
  },
  resumeSuspended: (id) => {
    const suspended = get().suspended
    const entry = suspended.find((s) => s.id === id)
    if (!entry) return false
    // Jika keranjang aktif memiliki item, tahan dulu agar tidak hilang
    const current = get().items
    const newSuspended = suspended.filter((s) => s.id !== id)
    if (current.length > 0) {
      newSuspended.push({
        id: `SUS-${Date.now()}`,
        label: `Auto suspend ${new Date().toLocaleTimeString('id-ID')}`,
        items: current.map((i) => ({ ...i })),
        savedAt: new Date().toISOString(),
      })
    }
    set({ items: entry.items.map((i) => ({ ...i })), suspended: newSuspended })
    return true
  },
  removeSuspended: (id) =>
    set({ suspended: get().suspended.filter((s) => s.id !== id) }),
}))
