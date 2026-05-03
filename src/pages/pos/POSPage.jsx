import { useEffect, useRef, useState } from 'react'
import { Search, Plus, Minus, Trash2, Keyboard, Ban, XOctagon, RotateCcw, PauseCircle, PlayCircle, X } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { formatRupiah } from '../../utils/format'
import CheckoutModal from './CheckoutModal'
import RefundModal from './RefundModal'
import { searchProduct } from '../../services/productService'
import { notification } from '../../utils/toast'
import AdminVerifyModal from '../../components/globals/AdminVerifyModal'
import { createAuditLog } from '../../services/auditLogService'

const SHORTCUTS = [
  { keys: 'F2', desc: 'Fokus scan barcode' },
  { keys: 'F3', desc: 'Fokus cari produk' },
  { keys: 'F4 / *', desc: 'Fokus ubah jumlah (Qty)' },
  { keys: 'Enter di Qty', desc: 'Pindah ke scan barcode' },
  { keys: '+ / -', desc: 'Tambah / kurangi nilai Qty' },
  { keys: 'F9', desc: 'Bayar / Checkout' },
  { keys: 'F8', desc: 'Suspend / Tahan transaksi' },
  { keys: 'F6', desc: 'Void item (perlu admin)' },
  { keys: 'F7', desc: 'Abort transaksi (perlu admin)' },
  { keys: 'F10', desc: 'Refund transaksi (perlu admin)' },
  { keys: 'Ctrl + ↑/↓', desc: 'Tambah / kurangi qty item terakhir' },
  { keys: 'Esc', desc: 'Tutup popup / bersihkan pencarian' },
]

export default function POSPage() {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [barcode, setBarcode] = useState('')
  const [scanQty, setScanQty] = useState('1')
  const [scanError, setScanError] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [productSelection, setProductSelection] = useState(null)
  const [priceSelection, setPriceSelection] = useState(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  // adminAction: { type: 'void', key } | { type: 'abort' } | null
  const [adminAction, setAdminAction] = useState(null)
  // Modal pemilihan item untuk di-void
  const [voidPicker, setVoidPicker] = useState(false)
  const [showRefund, setShowRefund] = useState(false)
  const [showSuspendList, setShowSuspendList] = useState(false)
  const [showSuspendPrompt, setShowSuspendPrompt] = useState(false)
  const [suspendLabel, setSuspendLabel] = useState('')

  const barcodeRef = useRef(null)
  const searchRef = useRef(null)
  const qtyRef = useRef(null)

  const { items, addItem, removeItem, updateQty, clearCart, getTotal, suspended, suspendCurrent, resumeSuspended, removeSuspended } =
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
        uomId: product.uomId || product.uom?.id || null,
        uomCode: product.uom?.code || null,
        uomName: product.uom?.name || null,
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

  // Minta verifikasi admin sebelum void / abort
  const requestVoid = (key) => {
    if (!key) return
    setVoidPicker(false)
    setAdminAction({ type: 'void', key })
  }
  const openVoidPicker = () => {
    if (items.length === 0) return
    setVoidPicker(true)
  }
  const requestAbort = () => {
    if (items.length === 0) return
    setAdminAction({ type: 'abort' })
  }
  const handleAdminVerified = async (creds) => {
    if (!adminAction) return
    if (adminAction.type === 'void') {
      const target = items.find((it) => it.key === adminAction.key)
      removeItem(adminAction.key)
      await createAuditLog({
        action: 'VOID_ITEM',
        verifierUsername: creds?.username,
        verifierPassword: creds?.password,
        reason: 'Void item sebelum checkout',
        payload: target
          ? {
              productId: target.id || target.productId,
              name: target.name,
              barcode: target.barcode || null,
              qty: target.qty,
              priceName: target.priceName,
              price: target.price,
            }
          : null,
      })
      notification('Void', 'Item berhasil dihapus oleh admin.', 'success')
    } else if (adminAction.type === 'abort') {
      const snapshot = items.map((it) => ({
        productId: it.id || it.productId,
        name: it.name,
        barcode: it.barcode || null,
        qty: it.qty,
        priceName: it.priceName,
        price: it.price,
      }))
      const totalQty = snapshot.reduce((s, it) => s + (Number(it.qty) || 0), 0)
      const total = snapshot.reduce(
        (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0),
        0,
      )
      clearCart()
      await createAuditLog({
        action: 'ABORT_SALE',
        verifierUsername: creds?.username,
        verifierPassword: creds?.password,
        reason: 'Abort penjualan sebelum checkout',
        payload: { items: snapshot, totalQty, total },
      })
      notification('Abort', 'Transaksi dibatalkan oleh admin.', 'success')
    }
    setAdminAction(null)
  }

  // Suspend transaksi aktif
  const handleSuspend = () => {
    if (items.length === 0) return
    setSuspendLabel('')
    setShowSuspendPrompt(true)
  }
  const confirmSuspend = () => {
    const entry = suspendCurrent(suspendLabel)
    setShowSuspendPrompt(false)
    if (entry) {
      notification('Suspend', `Transaksi ditahan: ${entry.label}`, 'success')
    }
  }
  const handleResume = (id) => {
    const ok = resumeSuspended(id)
    if (ok) {
      setShowSuspendList(false)
      notification('Resume', 'Transaksi yang ditahan dipanggil kembali.', 'success')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Escape: tutup modal/popup atau reset
      if (e.key === 'Escape') {
        if (showSuspendPrompt) {
          setShowSuspendPrompt(false)
          return
        }
        if (showSuspendList) {
          setShowSuspendList(false)
          return
        }
        if (adminAction) {
          setAdminAction(null)
          return
        }
        if (voidPicker) {
          setVoidPicker(false)
          return
        }
        if (showRefund) {
          setShowRefund(false)
          return
        }
        if (showShortcuts) {
          setShowShortcuts(false)
          return
        }
        if (priceSelection) {
          setPriceSelection(null)
          return
        }
        if (productSelection) {
          setProductSelection(null)
          return
        }
        if (showCheckout) {
          setShowCheckout(false)
          return
        }
        if (search) {
          setSearch('')
          setSearchResults([])
          return
        }
        if (barcode) {
          setBarcode('')
          setScanError('')
        }
        return
      }

      // Jika sedang ada modal/popup, abaikan shortcut lain
      if (showCheckout || productSelection || priceSelection || showShortcuts || adminAction || voidPicker || showRefund || showSuspendList || showSuspendPrompt) return

      // F1: bantuan shortcut
      if (e.key === 'F1') {
        e.preventDefault()
        setShowShortcuts(true)
        return
      }

      // F2: fokus barcode
      if (e.key === 'F2') {
        e.preventDefault()
        barcodeRef.current?.focus()
        barcodeRef.current?.select()
        return
      }

      // F3: fokus pencarian produk
      if (e.key === 'F3') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
        return
      }

      // F4 atau "*": fokus qty (gaya POS klasik)
      const tagName = (e.target?.tagName || '').toLowerCase()
      const inOtherInput =
        (tagName === 'input' || tagName === 'textarea') &&
        e.target !== qtyRef.current
      if (e.key === 'F4' || (e.key === '*' && !inOtherInput)) {
        e.preventDefault()
        qtyRef.current?.focus()
        qtyRef.current?.select()
        return
      }

      // "+" / "-": tambah / kurangi nilai Qty (di luar input lain)
      if (!inOtherInput && (e.key === '+' || e.key === '-')) {
        e.preventDefault()
        const current = Number(scanQty) || 1
        const next = e.key === '+' ? current + 1 : Math.max(1, current - 1)
        setScanQty(String(next))
        return
      }

      // F6: void item (pilih item lalu verifikasi admin)
      if (e.key === 'F6') {
        e.preventDefault()
        openVoidPicker()
        return
      }

      // F7: abort transaksi / bersihkan keranjang (perlu verifikasi admin)
      if (e.key === 'F7') {
        e.preventDefault()
        requestAbort()
        return
      }

      // F10: refund transaksi (cari trx via barcode/no transaksi)
      if (e.key === 'F10') {
        e.preventDefault()
        setShowRefund(true)
        return
      }

      // F9: checkout / bayar
      if (e.key === 'F9') {
        e.preventDefault()
        if (items.length > 0) setShowCheckout(true)
        return
      }

      // F8: suspend transaksi aktif
      if (e.key === 'F8') {
        e.preventDefault()
        handleSuspend()
        return
      }

      // Ctrl + ArrowUp/Down: ubah qty item terakhir
      if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        if (items.length === 0) return
        e.preventDefault()
        const last = items[items.length - 1]
        const nextQty = e.key === 'ArrowUp' ? last.qty + 1 : last.qty - 1
        updateQty(last.key, nextQty)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    items,
    search,
    barcode,
    scanQty,
    showSuspendList,
    showSuspendPrompt,
    showCheckout,
    productSelection,
    priceSelection,
    showShortcuts,
    adminAction,
    voidPicker,
    showRefund,
    clearCart,
    removeItem,
    updateQty,
  ])

  return (
    <div className="min-h-screen bg-[#f4f1ee]">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-4 py-3 sm:py-6 flex min-h-screen flex-col">
        <main className="flex-1 flex flex-col space-y-4 sm:space-y-6 pb-24">
          <div className="rounded-[24px] sm:rounded-[40px] bg-white shadow-sm border border-orange-100 p-4 sm:p-6 flex flex-col">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-orange-600">POS Kasir</h2>
                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                      Kelola transaksi dan laporan penjualan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShortcuts(true)}
                    title="Shortcut keyboard (F1)"
                    className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-100"
                  >
                    <Keyboard size={14} /> F1
                  </button>
                </div>
              </div>
              <div className="grid gap-2 grid-cols-[80px_1fr] sm:grid-cols-[100px_minmax(0,1fr)] xl:grid-cols-[100px_minmax(0,1fr)_360px]">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="scanQty"
                    className="text-sm font-semibold text-gray-600"
                  >
                    Qty
                  </label>
                  <input
                    id="scanQty"
                    ref={qtyRef}
                    type="number"
                    value={scanQty}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const value = Number(scanQty)
                        if (!value || value < 1) setScanQty('1')
                        barcodeRef.current?.focus()
                        barcodeRef.current?.select()
                      }
                    }}
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
                    ref={barcodeRef}
                    type="text"
                    placeholder="Scan barcode... (F2)"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                <div className="relative max-w-sm w-full xl:w-[360px]">
                  <Search size={16} className="absolute left-3 top-3 text-orange-300" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Cari produk... (F3)"
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

            <div className="mt-4 sm:mt-6 flex-1 min-h-0 overflow-x-auto">
              <div className="h-full min-h-0 max-h-[400px] sm:max-h-[520px] overflow-y-auto rounded-[20px] sm:rounded-[32px] border border-orange-100">
                <table className="w-full min-w-[480px] sm:min-w-[720px]">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs sm:text-sm border-b border-orange-100">
                      <th className="px-3 sm:px-5 py-3 sm:py-4 font-semibold">Produk</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 font-semibold">Qty</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 font-semibold hidden sm:table-cell">Harga</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 font-semibold text-right">Total</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 sm:py-16 text-center text-gray-400 text-sm">
                          Belum ada item di keranjang
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.key} className="text-xs sm:text-sm border-b border-orange-50 hover:bg-orange-50/50">
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-700 font-medium">
                            {item.name}
                            <div className="mt-0.5 flex flex-wrap gap-1 sm:gap-2 text-xs text-gray-500">
                              {item.priceLabel && <span>{item.priceLabel}</span>}
                              {item.uomCode && (
                                <span className="rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">
                                  {item.uomCode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-orange-50 rounded-full px-1.5 sm:px-2 py-1">
                              <button
                                onClick={() => updateQty(item.key, item.qty - 1)}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-orange-200 flex items-center justify-center"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-5 sm:w-6 text-center text-xs font-semibold">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.key, item.qty + 1)}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-orange-200 flex items-center justify-center"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            {item.uomCode && (
                              <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                                {item.uomCode}
                              </div>
                            )}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-600 hidden sm:table-cell">{formatRupiah(item.price)}</td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-right font-bold text-gray-800">{formatRupiah(item.price * item.qty)}</td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-right">
                            <button
                              onClick={() => requestVoid(item.key)}
                              title="Void item (perlu admin)"
                              className="inline-flex w-7 h-7 sm:w-8 sm:h-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                            >
                              <Trash2 size={13} />
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

          <footer className="sticky bottom-0 z-10 mt-4 sm:mt-6 rounded-[24px] sm:rounded-[40px] bg-white p-3 sm:p-6 shadow-sm border border-orange-100">
            <div className="grid gap-3 sm:gap-6 lg:grid-cols-[1fr_360px]">
              <div className="rounded-[20px] sm:rounded-[32px] bg-orange-50 p-3 sm:p-4">
                <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500">Summary</p>
                <div className="mt-2 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
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

              <div className="rounded-[20px] sm:rounded-[32px] bg-green-500 p-3 sm:p-4 text-white flex flex-col justify-between">
                <div className="flex items-center justify-between sm:block">
                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em]">Total</p>
                  <p className="text-2xl sm:text-4xl sm:mt-4 font-bold">{formatRupiah(total)}</p>
                </div>
                <div className="mt-3 sm:mt-6 grid gap-2 sm:gap-3">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      onClick={openVoidPicker}
                      disabled={items.length === 0}
                      title="Void item (pilih item, perlu admin)"
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-white/30 bg-white/10 px-1.5 sm:px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Ban size={12} /> Void (F6)
                    </button>
                    <button
                      onClick={requestAbort}
                      disabled={items.length === 0}
                      title="Abort transaksi (perlu admin)"
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-white/30 bg-white/10 px-1.5 sm:px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <XOctagon size={12} /> Abort (F7)
                    </button>
                    <button
                      onClick={() => setShowRefund(true)}
                      title="Refund transaksi sebelumnya (perlu admin)"
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-white/30 bg-white/10 px-1.5 sm:px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white hover:bg-white/20"
                    >
                      <RotateCcw size={12} /> Refund (F10)
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button
                      onClick={handleSuspend}
                      disabled={items.length === 0}
                      title="Tahan transaksi"
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-white/30 bg-white/10 px-1.5 sm:px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <PauseCircle size={12} /> Suspend (F8)
                    </button>
                    <button
                      onClick={() => setShowSuspendList(true)}
                      disabled={suspended.length === 0}
                      title="Lihat transaksi yang ditahan"
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-white/30 bg-white/10 px-1.5 sm:px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <PlayCircle size={12} /> Resume ({suspended.length})
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCheckout(true)}
                    disabled={items.length === 0}
                    className="w-full rounded-full bg-white px-4 py-2.5 sm:py-3 text-sm font-semibold text-green-600 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Bayar (F9)
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </main>

        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Shortcut Keyboard</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Percepat aktivitas kasir dengan tombol berikut.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(false)}
                  className="rounded-full bg-orange-50 p-2 text-gray-500 hover:bg-orange-100"
                >
                  ✕
                </button>
              </div>
              <ul className="mt-5 divide-y divide-orange-50">
                {SHORTCUTS.map((s) => (
                  <li
                    key={s.keys}
                    className="flex items-center justify-between gap-4 py-2.5 text-sm"
                  >
                    <span className="text-gray-600">{s.desc}</span>
                    <kbd className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

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

        {showRefund && (
          <RefundModal
            onClose={() => setShowRefund(false)}
            onSuccess={() => setShowRefund(false)}
          />
        )}

        {adminAction && (
          <AdminVerifyModal
            title={adminAction.type === 'abort' ? 'Abort Transaksi' : 'Void Item'}
            description={
              adminAction.type === 'abort'
                ? 'Membatalkan seluruh transaksi memerlukan persetujuan admin.'
                : 'Menghapus item dari keranjang memerlukan persetujuan admin.'
            }
            confirmLabel={adminAction.type === 'abort' ? 'Abort' : 'Void'}
            tone="red"
            onCancel={() => setAdminAction(null)}
            onVerified={handleAdminVerified}
          />
        )}

        {voidPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Pilih Item untuk Void</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Pilih salah satu item di keranjang. Verifikasi admin akan diminta setelahnya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVoidPicker(false)}
                  className="rounded-full bg-orange-50 p-2 text-gray-500 hover:bg-orange-100"
                >
                  ✕
                </button>
              </div>
              <div className="mt-5 grid gap-2 max-h-[420px] overflow-y-auto">
                {items.map((it) => (
                  <button
                    key={it.key}
                    type="button"
                    onClick={() => requestVoid(it.key)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-100"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{it.name}</div>
                      <div className="text-xs text-gray-500">
                        {it.priceLabel ? `${it.priceLabel} · ` : ''}
                        Qty: {it.qty}{it.uomCode ? ` ${it.uomCode}` : ''} · {formatRupiah(it.price)}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-800 whitespace-nowrap">
                      {formatRupiah(it.price * it.qty)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showSuspendPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Tahan Transaksi</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Beri label opsional supaya transaksi mudah dipanggil kembali.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuspendPrompt(false)}
                  className="rounded-full bg-orange-50 p-2 text-gray-500 hover:bg-orange-100"
                >
                  <X size={16} />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                value={suspendLabel}
                onChange={(e) => setSuspendLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmSuspend()}
                placeholder="Misal: Pak Budi"
                className="mt-4 w-full rounded-full border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuspendPrompt(false)}
                  className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmSuspend}
                  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Tahan
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuspendList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Transaksi Ditahan</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Pilih transaksi untuk dipanggil kembali. Keranjang aktif akan ikut ditahan otomatis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuspendList(false)}
                  className="rounded-full bg-orange-50 p-2 text-gray-500 hover:bg-orange-100"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-5 grid gap-2 max-h-[420px] overflow-y-auto">
                {suspended.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">Belum ada transaksi ditahan.</p>
                ) : (
                  suspended.map((s) => {
                    const subtotal = s.items.reduce((sum, i) => sum + i.price * i.qty, 0)
                    const qty = s.items.reduce((sum, i) => sum + i.qty, 0)
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-gray-700"
                      >
                        <button
                          type="button"
                          onClick={() => handleResume(s.id)}
                          className="flex-1 text-left"
                        >
                          <div className="font-semibold">{s.label}</div>
                          <div className="text-xs text-gray-500">
                            {qty} item · {formatRupiah(subtotal)} · {new Date(s.savedAt).toLocaleTimeString('id-ID')}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSuspended(s.id)}
                          title="Hapus suspend"
                          className="rounded-full bg-white p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
