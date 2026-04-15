import { create } from 'zustand'

const INITIAL_PRODUCTS = [
  { id: 1, sku: 'SHF-001', barcode: '899256633154667', name: 'Indomie Goreng', category: 'Mie Instan', stock: 200, price: 3500 },
  { id: 2, sku: 'SHF-002', barcode: '899256633154668', name: 'Aqua 600ml', category: 'Minuman', stock: 300, price: 4000 },
  { id: 3, sku: 'SHF-003', barcode: '899256633154669', name: 'Teh Botol Sosro', category: 'Minuman', stock: 150, price: 5500 },
  { id: 4, sku: 'SHF-004', barcode: '899256633154670', name: 'Beras 5kg', category: 'Sembako', stock: 50, price: 75000 },
  { id: 5, sku: 'SHF-005', barcode: '899256633154671', name: 'Pocari Sweat 500ml', category: 'Minuman', stock: 120, price: 8500 },
  { id: 6, sku: 'SHF-006', barcode: '899256633154672', name: 'Sprite 390ml', category: 'Minuman', stock: 100, price: 7000 },
  { id: 7, sku: 'SHF-007', barcode: '899256633154673', name: 'Chitato Sapi Panggang', category: 'Snack', stock: 80, price: 10000 },
  { id: 8, sku: 'SHF-008', barcode: '899256633154674', name: 'Lays Original', category: 'Snack', stock: 75, price: 10000 },
  { id: 9, sku: 'SHF-009', barcode: '899256633154675', name: 'Beng-Beng', category: 'Snack', stock: 200, price: 3000 },
  { id: 10, sku: 'SHF-010', barcode: '899256633154676', name: 'Silverqueen 65gr', category: 'Snack', stock: 60, price: 15000 },
  { id: 11, sku: 'SHF-011', barcode: '899256633154677', name: 'Minyak Goreng 2L', category: 'Sembako', stock: 40, price: 38000 },
  { id: 12, sku: 'SHF-012', barcode: '899256633154678', name: 'Gula 1kg', category: 'Sembako', stock: 60, price: 18000 },
  { id: 13, sku: 'SHF-013', barcode: '899256633154679', name: 'Sabun Mandi Lifebuoy', category: 'Perawatan', stock: 90, price: 5500 },
  { id: 14, sku: 'SHF-014', barcode: '899256633154680', name: 'Shampoo Pantene 90ml', category: 'Perawatan', stock: 70, price: 12000 },
  { id: 15, sku: 'SHF-015', barcode: '899256633154681', name: 'Pasta Gigi Pepsodent', category: 'Perawatan', stock: 80, price: 9500 },
  { id: 16, sku: 'SHF-016', barcode: '899256633154682', name: 'Deterjen Rinso 800gr', category: 'Kebersihan', stock: 45, price: 22000 },
  { id: 17, sku: 'SHF-017', barcode: '899256633154683', name: 'Tisu Paseo 250 Sheet', category: 'Kebersihan', stock: 55, price: 14000 },
  { id: 18, sku: 'SHF-018', barcode: '899256633154684', name: 'Roti Tawar Sari Roti', category: 'Roti & Susu', stock: 30, price: 16000 },
  { id: 19, sku: 'SHF-019', barcode: '899256633154685', name: 'Susu Ultra Milk 250ml', category: 'Roti & Susu', stock: 120, price: 5500 },
  { id: 20, sku: 'SHF-020', barcode: '899256633154686', name: 'Kopi Sachet ABC', category: 'Minuman', stock: 90, price: 7500 },
]

const INITIAL_PURCHASES = [
  { id: 'PO-001', vendor: 'CV. Mitra Utama', date: '2026-04-08T08:00:00', total: 720000, status: 'Diterima' },
  { id: 'PO-002', vendor: 'UD. Sumber Makmur', date: '2026-04-09T09:20:00', total: 540000, status: 'Proses' },
  { id: 'PO-003', vendor: 'PT. Graha Logistik', date: '2026-04-10T10:18:00', total: 910000, status: 'Dibatalkan' },
]

const INITIAL_TRANSACTIONS = [
  {
    id: 'TRX-001',
    date: '2026-04-08T08:12:00',
    items: 5,
    total: 42500,
    method: 'Tunai',
    status: 'Selesai',
    details: [
      { id: 1, name: 'Indomie Goreng', qty: 2, price: 3500 },
      { id: 3, name: 'Aqua 600ml', qty: 1, price: 4000 },
      { id: 9, name: 'Beng-Beng', qty: 2, price: 3000 },
    ],
  },
  {
    id: 'TRX-002',
    date: '2026-04-08T08:47:00',
    items: 3,
    total: 97000,
    method: 'QRIS',
    status: 'Selesai',
    details: [
      { id: 4, name: 'Beras 5kg', qty: 1, price: 75000 },
      { id: 5, name: 'Pocari Sweat 500ml', qty: 1, price: 8500 },
      { id: 6, name: 'Sprite 390ml', qty: 1, price: 7000 },
    ],
  },
  {
    id: 'TRX-008',
    date: '2026-04-08T12:45:00',
    items: 1,
    total: 3500,
    method: 'Tunai',
    status: 'Void',
    details: [{ id: 1, name: 'Indomie Goreng', qty: 1, price: 3500 }],
  },
  {
    id: 'TRX-011',
    date: '2026-04-08T14:19:00',
    items: 3,
    total: 80000,
    method: 'Tunai',
    status: 'Abort',
    details: [
      { id: 2, name: 'Aqua 600ml', qty: 2, price: 4000 },
      { id: 14, name: 'Shampoo Pantene 90ml', qty: 1, price: 12000 },
    ],
  },
]

function createTransactionId() {
  return `TRX-${Date.now()}`
}

export const useAppStore = create((set, get) => ({
  products: INITIAL_PRODUCTS,
  purchaseOrders: INITIAL_PURCHASES,
  transactions: INITIAL_TRANSACTIONS,
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [
        { id: createTransactionId(), date: new Date().toISOString(), ...transaction },
        ...state.transactions,
      ],
    })),
  updateProductStock: (productId, delta) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, product.stock + delta) }
          : product
      ),
    })),
  bulkUpdateStock: (items, deltaSign = -1) =>
    set((state) => ({
      products: state.products.map((product) => {
        const item = items.find((entry) => entry.id === product.id)
        if (!item) return product
        return { ...product, stock: Math.max(0, product.stock + item.qty * deltaSign) }
      }),
    })),
}))
