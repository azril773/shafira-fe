import { useEffect, useRef, useState } from 'react'
import { Search, X, Barcode, RotateCcw, ArrowLeft } from 'lucide-react'
import { searchTransactions, refundTransaction } from '../../services/transactionService'
import { formatRupiah, formatDate } from '../../utils/format'
import { notification } from '../../utils/toast'
import AdminVerifyModal from '../../components/globals/AdminVerifyModal'

export default function RefundModal({ onClose, onSuccess }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedTrx, setSelectedTrx] = useState(null)
  const [detailIds, setDetailIds] = useState([])
  const [reason, setReason] = useState('')
  const [pendingRefund, setPendingRefund] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const queryRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => queryRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  // Esc menutup modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !pendingRefund && !submitting) {
        e.preventDefault()
        if (selectedTrx) setSelectedTrx(null)
        else onClose?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingRefund, submitting, selectedTrx, onClose])

  const doSearch = async (e) => {
    e?.preventDefault?.()
    const q = query.trim()
    if (!q) return
    setSearching(true)
    // cari berdasarkan no transaksi terlebih dulu
    const byTrx = await searchTransactions({
      page: 1,
      transactionNo: q,
      status: 'POSTED',
    })
    let combined = byTrx.data || []
    // selalu tambahkan hasil cari berdasarkan barcode (digabung tanpa duplikat)
    const byBarcode = await searchTransactions({
      page: 1,
      barcode: q,
      status: 'POSTED',
    })
    const seen = new Set(combined.map((t) => t.id))
    for (const t of byBarcode.data || []) {
      if (!seen.has(t.id)) combined.push(t)
    }
    setResults(combined)
    setSearching(false)
    if (combined.length === 0) {
      notification('Tidak ditemukan', 'Tidak ada transaksi cocok yang bisa diretur.', 'warning')
    }
  }

  const openTrx = (trx) => {
    setSelectedTrx(trx)
    // pre-select item yang cocok dengan query barcode (jika ada)
    const q = query.trim().toLowerCase()
    const initial = (trx.transactionDetails || [])
      .filter((d) => !d.isRefund)
      .filter((d) =>
        q
          ? d.historicalBarcode?.toLowerCase().includes(q) ||
            d.historicalName?.toLowerCase().includes(q)
          : false,
      )
      .map((d) => d.id)
    setDetailIds(initial)
    setReason('')
  }

  const toggleDetail = (id) => {
    setDetailIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const requestRefund = () => {
    if (!selectedTrx) return
    if (detailIds.length === 0) {
      notification('Gagal', 'Pilih minimal satu item untuk diretur.', 'error')
      return
    }
    if (!reason.trim()) {
      notification('Gagal', 'Alasan retur wajib diisi.', 'error')
      return
    }
    setPendingRefund(true)
  }

  const onAdminVerified = async () => {
    setPendingRefund(false)
    setSubmitting(true)
    const { data, error } = await refundTransaction(selectedTrx.id, {
      detailIds,
      reason: reason.trim(),
    })
    setSubmitting(false)
    if (error || !data) {
      notification('Gagal', error || 'Gagal melakukan refund.', 'error')
      return
    }
    notification('Berhasil', 'Item berhasil diretur. Stok sudah ditambahkan.', 'success')
    onSuccess?.()
    onClose?.()
  }

  const refundableDetails = (selectedTrx?.transactionDetails || []).filter((d) => !d.isRefund)
  const refundTotal = refundableDetails
    .filter((d) => detailIds.includes(d.id))
    .reduce((sum, d) => sum + Number(d.historicalPrice) * d.qty, 0)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {selectedTrx && (
                <button
                  type="button"
                  onClick={() => setSelectedTrx(null)}
                  className="rounded-full bg-gray-50 p-1.5 text-gray-500 hover:bg-gray-100"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-orange-500" />
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedTrx ? `Refund — ${selectedTrx.transactionNo}` : 'Refund Transaksi'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedTrx
                      ? formatDate(selectedTrx.createdAt)
                      : 'Cari transaksi berdasarkan no. transaksi atau barcode produk.'}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {!selectedTrx && (
            <>
              <form onSubmit={doSearch} className="px-5 pt-4 flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    ref={queryRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="No. transaksi atau scan barcode produk..."
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
                >
                  {searching ? 'Mencari...' : 'Cari'}
                </button>
              </form>
              <div className="px-5 py-4 max-h-[55vh] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    Hasil pencarian akan tampil di sini.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {results.map((trx) => (
                      <li key={trx.id}>
                        <button
                          type="button"
                          onClick={() => openTrx(trx)}
                          className="w-full text-left py-3 px-3 rounded-lg hover:bg-orange-50 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-800">{trx.transactionNo}</div>
                            <div className="text-xs text-gray-500">
                              {formatDate(trx.createdAt)} · {trx.totalQty} item · Kasir: {trx.cashier?.username || '-'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{formatRupiah(trx.totalPrice)}</div>
                            <div className="text-xs text-orange-500">{trx.paymentMethod}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {selectedTrx && (
            <>
              <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
                {refundableDetails.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-400">
                    Tidak ada item yang dapat diretur (semua sudah diretur).
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-gray-500">
                      <tr className="border-b border-gray-100">
                        <th className="py-2 w-8"></th>
                        <th className="text-left py-2 font-medium">Produk</th>
                        <th className="text-left py-2 font-medium">Barcode</th>
                        <th className="text-right py-2 font-medium">Qty</th>
                        <th className="text-right py-2 font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refundableDetails.map((d) => (
                        <tr key={d.id} className="border-b border-gray-50 hover:bg-orange-50/50">
                          <td className="py-2">
                            <input
                              type="checkbox"
                              checked={detailIds.includes(d.id)}
                              onChange={() => toggleDetail(d.id)}
                              className="h-4 w-4 accent-orange-500"
                            />
                          </td>
                          <td className="py-2 text-gray-700">
                            {d.historicalName}
                            <div className="text-xs text-gray-400">{d.historicalPriceName}</div>
                          </td>
                          <td className="py-2 text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <Barcode size={12} /> {d.historicalBarcode}
                            </span>
                          </td>
                          <td className="py-2 text-right">{d.qty}</td>
                          <td className="py-2 text-right font-semibold">
                            {formatRupiah(Number(d.historicalPrice) * d.qty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="px-5 pb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Alasan Retur</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Mis. produk rusak / salah pilih..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
                <div className="text-sm">
                  <span className="text-gray-500">Total Refund: </span>
                  <span className="font-bold text-orange-600">{formatRupiah(refundTotal)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={requestRefund}
                    disabled={submitting || detailIds.length === 0}
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
                  >
                    {submitting ? 'Memproses...' : 'Refund'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {pendingRefund && (
        <AdminVerifyModal
          title="Refund Transaksi"
          description="Mengembalikan barang dan stok memerlukan persetujuan admin."
          confirmLabel="Refund"
          tone="red"
          onCancel={() => setPendingRefund(false)}
          onVerified={onAdminVerified}
        />
      )}
    </>
  )
}
