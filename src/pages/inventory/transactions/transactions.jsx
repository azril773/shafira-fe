import { useEffect, useState, useCallback } from 'react'
import { Search, X, Calendar, Barcode, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { searchTransactions } from '../../../services/transactionService'
import { formatRupiah, formatDate } from '../../../utils/format'
import { notification } from '../../../utils/toast'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'VOIDED', label: 'Voided' },
]

const statusBadge = (status) => {
  const map = {
    POSTED: 'bg-green-50 text-green-700 border-green-200',
    REFUNDED: 'bg-amber-50 text-amber-700 border-amber-200',
    VOIDED: 'bg-red-50 text-red-600 border-red-200',
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export default function InventoryTransactionsPage() {
  const [transactionNo, setTransactionNo] = useState('')
  const [barcode, setBarcode] = useState('')
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data, totalPages: tp, error } = await searchTransactions({
      page,
      status: status || undefined,
      transactionNo: transactionNo.trim() || undefined,
      date: date || undefined,
      barcode: barcode.trim() || undefined,
    })
    if (error) notification('Gagal', error, 'error')
    setTransactions(data || [])
    setTotalPages(tp || 1)
    setLoading(false)
  }, [page, status, date, barcode, transactionNo])

  useEffect(() => {
    fetchData()
  }, [page, status, date, fetchData])

  const onSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const resetFilters = () => {
    setTransactionNo('')
    setBarcode('')
    setDate('')
    setStatus('')
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Histori Transaksi</h2>
          <p className="text-sm text-gray-500">Cari transaksi berdasarkan tanggal atau barcode produk.</p>
        </div>
      </div>

      {/* Filters */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm grid gap-3 md:grid-cols-[1fr_1fr_1fr_180px_auto]"
      >
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={transactionNo}
            onChange={(e) => setTransactionNo(e.target.value)}
            placeholder="No. Transaksi"
            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="relative">
          <Barcode size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Barcode produk"
            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
          >
            Cari
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="rounded-2xl border border-orange-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-orange-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">No. Transaksi</th>
                <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
                <th className="text-left px-4 py-3 font-semibold">Kasir</th>
                <th className="text-right px-4 py-3 font-semibold">Qty</th>
                <th className="text-right px-4 py-3 font-semibold">Total</th>
                <th className="text-left px-4 py-3 font-semibold">Metode</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="py-10 text-center text-gray-400">Memuat...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="8" className="py-10 text-center text-gray-400">Tidak ada transaksi.</td></tr>
              ) : (
                transactions.map((trx) => {
                  const details = trx.transactionDetails || []
                  const refundedCount = details.filter((d) => d.isRefund).length
                  const hasPartialRefund = refundedCount > 0 && trx.status !== 'REFUNDED' && trx.status !== 'VOIDED'
                  return (
                  <tr key={trx.id} className="border-t border-orange-50 hover:bg-orange-50/40">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <span>{trx.transactionNo}</span>
                        {hasPartialRefund && (
                          <span
                            title={`${refundedCount} item telah diretur sebagian`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                          >
                            <RotateCcw size={10} /> Refund Sebagian ({refundedCount})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(trx.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{trx.cashier?.username || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{trx.totalQty}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatRupiah(trx.totalPrice)}</td>
                    <td className="px-4 py-3 text-gray-600">{trx.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs border font-semibold ${statusBadge(trx.status)}`}>
                        {trx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(trx)}
                        className="px-3 py-1.5 rounded-lg border border-orange-200 text-xs font-semibold text-orange-600 hover:bg-orange-50"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-orange-50 text-sm">
            <span className="text-gray-500">Halaman {page} dari {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-800">{selected.transactionNo}</h3>
                  {(() => {
                    const refundedCount = (selected.transactionDetails || []).filter((d) => d.isRefund).length
                    if (refundedCount === 0) return null
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <RotateCcw size={10} /> {refundedCount} item diretur
                      </span>
                    )
                  })()}
                </div>
                <p className="text-xs text-gray-500">{formatDate(selected.createdAt)} · Kasir: {selected.cashier?.username || '-'}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-500">
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-medium">Produk</th>
                    <th className="text-left py-2 font-medium">Barcode</th>
                    <th className="text-right py-2 font-medium">Qty</th>
                    <th className="text-right py-2 font-medium">Harga</th>
                    <th className="text-right py-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.transactionDetails || []).map((d) => (
                    <tr key={d.id} className={`border-b border-gray-50 ${d.isRefund ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-2 text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className={d.isRefund ? 'line-through text-gray-400' : ''}>{d.historicalName}</span>
                          {d.isRefund && (
                            <span
                              title={d.refundReason ? `Alasan: ${d.refundReason}` : 'Sudah diretur'}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200"
                            >
                              <RotateCcw size={10} /> Refunded
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{d.historicalPriceName}</div>
                        {d.isRefund && d.refundReason && (
                          <div className="text-[11px] text-amber-700 mt-0.5">Alasan: {d.refundReason}</div>
                        )}
                      </td>
                      <td className={`py-2 text-gray-600 ${d.isRefund ? 'line-through text-gray-400' : ''}`}>{d.historicalBarcode}</td>
                      <td className={`py-2 text-right ${d.isRefund ? 'line-through text-gray-400' : ''}`}>{d.qty}</td>
                      <td className={`py-2 text-right ${d.isRefund ? 'line-through text-gray-400' : ''}`}>{formatRupiah(d.historicalPrice)}</td>
                      <td className={`py-2 text-right font-semibold ${d.isRefund ? 'line-through text-gray-400' : ''}`}>{formatRupiah(Number(d.historicalPrice) * d.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-5 py-4 text-sm">
              <div className="text-gray-500">Status</div>
              <div className="text-right">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs border font-semibold ${statusBadge(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              <div className="text-gray-500">Metode Pembayaran</div>
              <div className="text-right text-gray-700">{selected.paymentMethod}</div>
              <div className="text-gray-500">Total Qty</div>
              <div className="text-right text-gray-700">{selected.totalQty}</div>
              <div className="text-gray-500">Total</div>
              <div className="text-right font-bold text-gray-900">{formatRupiah(selected.totalPrice)}</div>
              {selected.paymentMethod === 'Tunai' && (
                <>
                  <div className="text-gray-500">Bayar</div>
                  <div className="text-right text-gray-700">{formatRupiah(selected.cashAmount)}</div>
                  <div className="text-gray-500">Kembalian</div>
                  <div className="text-right text-gray-700">{formatRupiah(selected.changeAmount)}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
