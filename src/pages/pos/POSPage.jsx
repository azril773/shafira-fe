import { useEffect, useState } from 'react'
import { Search, Plus, Minus, Trash2 } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { formatRupiah } from '../../utils/format'
import CheckoutModal from './CheckoutModal'
import { searchProduct } from '../../services/productService'
import { notification } from '../../utils/toast'

export default function POSPage() {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [barcode, setBarcode] = useState('')
  const [scanQty, setScanQty] = useState('1')
  const [scanError, setScanError] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [productSelection, setProductSelection] = useState(null)
  const [priceSelection, setPriceSelection] = useState(null)

  const { items, addItem, removeItem, updateQty, clearCart, getTotal } =
    useCartStore()

  const itemTotal = items.reduce((sum, item) => sum + item.qty, 0)
  const total = getTotal()

  useEffect(() => {
    const q = search.trim()
    if (!q) {
      setSearchResults([])
      return
    }
    const handle = setTimeout(async () => {
      const { data } = await searchProduct({ page: 1, name: q })
      setSearchResults(data || [])
    }, 250)
    return () => clearTimeout(handle)
  }, [search])

  const getQty = () => {
    const q = Number(scanQty)
    return q > 0 ? q : 1
  }

  const addCartItem = (product, qty, priceOption) => {
    addItem(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        barcode: product.barcode,
        priceLabel: priceOption.name,
        priceName: priceOption.name,
        price: Number(priceOption.price),
      },
      qty,
    )
    setSearch('')
    setSearchResults([])
    setBarcode('')
    setScanError('')
  }

  const handleSelectProduct = (product) => {
    const qty = getQty()
    setProductSelection(null)
    if (!product.prices || product.prices.length === 0) {
      notification('Gagal', 'Produk tidak memiliki harga.', 'error')
      return
    }
    if (product.prices.length > 1) {
      setPriceSelection({ product, qty })
      return
    }
    addCartItem(product, qty, product.prices[0])
  }

  const handleScan = async () => {
    const code = barcode.trim()
    if (!code) {
      setScanError('Masukkan barcode terlebih dahulu')
      return
    }
    setScanError('')
    const { data, error } = await searchProduct({ page: 1, barcode: code })
    if (error) {
      setScanError(error)
      return
    }
    if (!data || data.length === 0) {
      setScanError('Barcode tidak ditemukan')
      return
    }
    if (data.length > 1) {
      setProductSelection({ products: data, qty: getQty() })
      return
    }
    handleSelectProduct(data[0])
  }

  const handlePriceChoice = (option) => {
    if (!priceSelection) return
    addCartItem(priceSelection.product, priceSelection.qty, option)
    setPriceSelection(null)
  }

  return (
    <div className="min-h-screen bg-[#f4f1ee]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 flex min-h-screen flex-col">
        <main className="flex-1 flex flex-col space-y-6 pb-24">
          <div className="rounded-[40px] bg-white shadow-sm border border-orange-100 p-6 min-h-[670px] flex flex-col">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-orange-600">POS Kasir</h2>
                <p className="text-sm text-gray-500">
                  Kelola transaksi dan laporan penjualan
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[100px_minmax(0,1fr)] xl:grid-cols-[100px_minmax(0,1fr)_360px]">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="scanQty"
                    className="text-sm font-semibold text-gray-600"
                  >
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
                    className="w-full rounded-full border border-orange-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
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
                    <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-3xl bg-white shadow-lg border border-orange-100 max-h-72 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        searchResults.slice(0, 8).map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-50"
                          >
                            <div className="font-semibold">{product.name}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{product.category}</span>
                              <span>Stok: {product.stock}</span>
                              {product.prices?.length > 1 && (
                                <span className="rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">
                                  Pilih Harga
                                </span>
                              )}
                            </div>
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

            <div className="mt-6 flex-1 min-h-0 overflow-x-auto">
              <div className="h-full min-h-0 max-h-[520px] overflow-y-auto rounded-[32px] border border-orange-100">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b border-orange-100">
                      <th className="px-5 py-4 font-semibold">Description</th>
                      <th className="px-5 py-4 font-semibold">Qty</th>
                      <th className="px-5 py-4 font-semibold">Price</th>
                      <th className="px-5 py-4 font-semibold text-right">Amount</th>
                      <th className="px-5 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-16 text-center text-gray-400 text-sm">
                          Belum ada item di keranjang
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.key} className="text-sm border-b border-orange-50 hover:bg-orange-50/50">
                          <td className="px-5 py-4 text-gray-700 font-medium">
                            {item.name}
                            {item.priceLabel && <div className="mt-1 text-xs text-gray-500">{item.priceLabel}</div>}
                          </td>
                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-1.5 bg-orange-50 rounded-full px-2 py-1">
                              <button
                                onClick={() => updateQty(item.key, item.qty - 1)}
                                className="w-6 h-6 rounded-full bg-white border border-orange-200 flex items-center justify-center"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center text-xs font-semibold">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.key, item.qty + 1)}
                                className="w-6 h-6 rounded-full bg-white border border-orange-200 flex items-center justify-center"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-gray-600">{formatRupiah(item.price)}</td>
                          <td className="px-5 py-4 text-right font-bold text-gray-800">{formatRupiah(item.price * item.qty)}</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => removeItem(item.key)}
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

          {productSelection && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
              <div className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Pilih Produk</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Beberapa produk memiliki barcode yang sama. Pilih salah satu.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductSelection(null)}
                    className="rounded-full bg-orange-50 p-2 text-gray-500 hover:bg-orange-100"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-6 grid gap-3 max-h-80 overflow-y-auto">
                  {productSelection.products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p)}
                      className="w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-100"
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {p.category} · Stok: {p.stock} · {p.code}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {priceSelection && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
              <div className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Pilih Harga</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Produk {priceSelection.product.name} memiliki lebih dari satu harga. Pilih harga yang akan ditambahkan ke keranjang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPriceSelection(null)}
                    className="rounded-full bg-orange-50 p-2 text-gray-500 hover:bg-orange-100"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-6 grid gap-3">
                  {priceSelection.product.prices.map((option) => (
                    <button
                      key={option.id || option.name}
                      type="button"
                      onClick={() => handlePriceChoice(option)}
                      className="w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-4 text-left text-sm text-gray-700 hover:bg-orange-100"
                    >
                      <div className="font-semibold">{option.name}</div>
                      <div className="mt-1 text-gray-500">{formatRupiah(Number(option.price))}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <footer className="sticky bottom-0 z-10 mt-6 rounded-[40px] bg-white p-6 shadow-sm border border-orange-100">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="rounded-[32px] bg-orange-50 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Summary</p>
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between gap-4">
                    <span>Item Total</span>
                    <span className="font-semibold text-gray-900">{itemTotal}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Total Bayar</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(total)}</span>
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
            items={items}
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
