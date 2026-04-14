import { useState, useMemo } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingBag, User, Clock, Calendar } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { formatRupiah } from '../../utils/format'
import CheckoutModal from './CheckoutModal'

const DUMMY_PRODUCTS = [
  { id: 1, barcode: '899256633154667', name: 'Indomie Goreng', price: 3500, category: 'Mie Instan', stock: 200 },
  { id: 2, barcode: '899256633154668', name: 'Indomie Kuah', price: 3500, category: 'Mie Instan', stock: 180 },
  { id: 3, barcode: '899256633154669', name: 'Aqua 600ml', price: 4000, category: 'Minuman', stock: 300 },
  { id: 4, barcode: '899256633154670', name: 'Teh Botol Sosro', price: 5500, category: 'Minuman', stock: 150 },
  { id: 5, barcode: '899256633154671', name: 'Pocari Sweat 500ml', price: 8500, category: 'Minuman', stock: 120 },
  { id: 6, barcode: '899256633154672', name: 'Sprite 390ml', price: 7000, category: 'Minuman', stock: 100 },
  { id: 7, barcode: '899256633154673', name: 'Chitato Sapi Panggang', price: 10000, category: 'Snack', stock: 80 },
  { id: 8, barcode: '899256633154674', name: 'Lays Original', price: 10000, category: 'Snack', stock: 75 },
  { id: 9, barcode: '899256633154675', name: 'Beng-Beng', price: 3000, category: 'Snack', stock: 200 },
  { id: 10, barcode: '899256633154676', name: 'Silverqueen 65gr', price: 15000, category: 'Snack', stock: 60 },
  { id: 11, barcode: '899256633154677', name: 'Beras 5kg', price: 75000, category: 'Sembako', stock: 50 },
  { id: 12, barcode: '899256633154678', name: 'Minyak Goreng 2L', price: 38000, category: 'Sembako', stock: 40 },
  { id: 13, barcode: '899256633154679', name: 'Gula 1kg', price: 18000, category: 'Sembako', stock: 60 },
  { id: 14, barcode: '899256633154680', name: 'Sabun Mandi Lifebuoy', price: 5500, category: 'Perawatan', stock: 90 },
  { id: 15, barcode: '899256633154681', name: 'Shampoo Pantene 90ml', price: 12000, category: 'Perawatan', stock: 70 },
  { id: 16, barcode: '899256633154682', name: 'Pasta Gigi Pepsodent', price: 9500, category: 'Perawatan', stock: 80 },
  { id: 17, barcode: '899256633154683', name: 'Deterjen Rinso 800gr', price: 22000, category: 'Kebersihan', stock: 45 },
  { id: 18, barcode: '899256633154684', name: 'Tisu Paseo 250 Sheet', price: 14000, category: 'Kebersihan', stock: 55 },
  { id: 19, barcode: '899256633154685', name: 'Roti Tawar Sari Roti', price: 16000, category: 'Roti & Susu', stock: 30 },
  { id: 20, barcode: '899256633154686', name: 'Susu Ultra Milk 250ml', price: 5500, category: 'Roti & Susu', stock: 120 },
]

export default function POSPage() {
  const [search, setSearch] = useState('')
  const [barcode, setBarcode] = useState('')
  const [scanQty, setScanQty] = useState('1')
  const [description, setDescription] = useState('')
  const [scanError, setScanError] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)

  const { items, addItem, removeItem, updateQty, clearCart, getTotal } = useCartStore()

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return DUMMY_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.barcode.includes(query)
    )
  }, [search])

  const handleSelectProduct = (product) => {
    const qty = Number(scanQty) > 0 ? Number(scanQty) : 1
    addItem(product, qty)
    setDescription(product.name)
    setSearch('')
    setScanError('')
  }

  const handleScan = () => {
    const code = barcode.trim()
    if (!code) {
      setScanError('Masukkan barcode terlebih dahulu')
      return
    }

    const product = DUMMY_PRODUCTS.find((p) => p.barcode === code)
    if (!product) {
      setScanError('Barcode tidak ditemukan')
      return
    }

    const qty = Number(scanQty) > 0 ? Number(scanQty) : 1
    addItem(product, qty)
    setDescription(product.name)
    setBarcode('')
    setScanError('')
  }
  const total = getTotal()

  return (
    <div className="min-h-screen bg-[#f4f1ee]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 flex min-h-screen flex-col">
        <main className="flex-1 overflow-auto space-y-6 pb-24">
            <div className="rounded-[40px] bg-white shadow-sm border border-orange-100 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-orange-600">POS Kasir</h2>
                  <p className="text-sm text-gray-500">Kelola transaksi dan laporan penjualan</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[100px_minmax(0,1fr)] xl:grid-cols-[100px_minmax(0,1fr)_360px]">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="scanQty" className="text-sm font-semibold text-gray-600">
                        Qty
                      </label>
                      <input
                        id="scanQty"
                        type="number"
                        value={scanQty}
                        onChange={(e) => setScanQty(e.target.value)}
                        onBlur={(e) => {
                          const value = Number(e.target.value)
                          if (value < 1 || e.target.value === '') {
                            setScanQty('1')
                          }
                        }}
                        style={{
                          MozAppearance: 'textfield',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                        }}
                        className="w-full rounded-full border border-orange-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-orange-300" />
                    <input
                      type="text"
                      placeholder="Scan barcode..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                      className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  <div className="relative max-w-sm w-full sm:w-[360px]">
                    <Search size={16} className="absolute left-3 top-3 text-orange-300" />
                    <input
                      type="text"
                      placeholder="Cari produk..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    {search && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-3xl bg-white shadow-lg border border-orange-100">
                        {searchResults.length > 0 ? (
                          searchResults.slice(0, 6).map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleSelectProduct(product)}
                              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-50"
                            >
                              <div className="font-semibold">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.category}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">Produk tidak ditemukan</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {scanError && <p className="mt-3 text-sm text-red-500">{scanError}</p>}

              <div className="mt-6 overflow-x-auto">
                <div className="max-h-[520px] overflow-y-auto rounded-[32px] border border-orange-100">
                  <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b border-orange-100">
                      <th className="px-5 py-4 font-semibold">Description</th>
                      <th className="px-5 py-4 font-semibold">Qty</th>
                      <th className="px-5 py-4 font-semibold">Price</th>
                      <th className="px-5 py-4 font-semibold">Discount</th>
                      <th className="px-5 py-4 font-semibold text-right">Amount</th>
                      <th className="px-5 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-16 text-center text-gray-400 text-sm">
                          Belum ada item di keranjang
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="text-sm border-b border-orange-50 hover:bg-orange-50/50">
                          <td className="px-5 py-4 text-gray-700 font-medium">{item.name}</td>
                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-1.5 bg-orange-50 rounded-full px-2 py-1">
                              <button
                                onClick={() => updateQty(item.id, item.qty - 1)}
                                className="w-6 h-6 rounded-full bg-white border border-orange-200 flex items-center justify-center"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center text-xs font-semibold">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.id, item.qty + 1)}
                                className="w-6 h-6 rounded-full bg-white border border-orange-200 flex items-center justify-center"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-gray-600">{formatRupiah(item.price)}</td>
                          <td className="px-5 py-4 text-gray-400">0</td>
                          <td className="px-5 py-4 text-right font-bold text-gray-800">{formatRupiah(item.price * item.qty)}</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>

            <footer className="sticky bottom-0 z-10 mt-6 rounded-[40px] bg-white p-6 shadow-sm border border-orange-100">
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr_260px]">
                <div className="rounded-[32px] bg-orange-50 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Member</p>
                  <div className="mt-4 space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between gap-4">
                      <span>No. Member</span>
                      <span className="font-semibold text-gray-900">00000000000002</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Nama</span>
                      <span className="font-semibold text-gray-900">Boboboy</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>No. Handphone</span>
                      <span className="font-semibold text-gray-900">085621478523</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] bg-orange-50 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Summary</p>
                  <div className="mt-4 space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between gap-4">
                      <span>Discount</span>
                      <span className="font-semibold text-gray-900">Rp. 200</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Item Total</span>
                      <span className="font-semibold text-gray-900">5</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Last Change</span>
                      <span className="font-semibold text-gray-900">Rp. 200.000.000</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] bg-green-500 p-4 text-white flex flex-col justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em]">Total</p>
                    <p className="mt-4 text-4xl font-bold">{formatRupiah(total)}</p>
                  </div>
                  <div className="mt-6 grid gap-3">
                    <button
                      onClick={clearCart}
                      disabled={items.length === 0}
                      className="w-full rounded-full border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Bersihkan
                    </button>
                    <button
                      onClick={() => setShowCheckout(true)}
                      disabled={items.length === 0}
                      className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-green-600 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Bayar
                    </button>
                  </div>
                </div>
              </div>
            </footer>
          </main>

          {showCheckout && (
            <CheckoutModal
              total={total}
              onClose={() => setShowCheckout(false)}
              onSuccess={() => {
                clearCart()
                setShowCheckout(false)
              }}
            />
          )}
      </div>
    </div>
  )
}

