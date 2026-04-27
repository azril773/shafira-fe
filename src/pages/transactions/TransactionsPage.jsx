import { useEffect, useState } from 'react'
import { Search, X, Ban, RotateCcw } from 'lucide-react'
import { formatRupiah, formatDate } from '../../utils/format'
import {
  searchTransactions,
  voidTransaction,
  refundTransaction,
} from '../../services/transactionService'
import { notification } from '../../utils/toast'

const STATUS_OPTIONS = ['', 'POSTED', 'REFUNDED', 'VOIDED']

const statusBadge = (status) => {
  const map = {
    POSTED: 'bg-green-50 text-green-700',
    REFUNDED: 'bg-amber-50 text-amber-700',
    VOIDED: 'bg-red-50 text-red-600',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [transactions, setTransactions] = useState([])
  const [selected, setSelected] = useState(null)
  const [refundMode, setRefundMode] = useState(false)
  const [refundDetailIds, setRefundDetailIds] = useState([])
  const [refundReason, setRefundReason] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { data, totalPages: tp, error } = await searchTransactions({
      page,
      status: status || undefined,
      transactionNo: search.trim() || undefined,
      date: date || undefined,
    })
    if (error) notification('Gagal', error, 'error')
    setTransactions(data || [])
    setTotalPages(tp || 1)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, date])

  const onSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const openDetail = (trx) => {
    setSelected(trx)
    setRefundMode(false)
    setRefundDetailIds([])
    setRefundReason('')
  }

  const closeDetail = () => {
    setSelected(null)
    setRefundMode(false)
  }

  const onVoid = async () => {
    if (!selected) return
    if (!confirm(`Batalkan transaksi ${selected.transactionNo}? Stok akan dikembalikan.`)) return
    const { data, error } = await voidTransaction(selected.id)
    if (error) {
      notification('Gagal', error, 'error')
      return
    }
    notification('Berhasil', 'Transaksi dibatalkan.', 'success')
    setSelected(data)
    fetchData()
  }

  const toggleRefundDetail = (id) => {
    setRefundDetailIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const onRefund = async () => {
    if (!selected) return
    if (refundDetailIds.length === 0) {
      notification('Gagal', 'Pilih minimal satu item untuk diretur.', 'error')
      return
    }
    if (!refundReason.trim()) {
      notification('Gagal', 'Alasan retur harus diisi.', 'error')
      return
    }
    const { data, error } = await refundTransaction(selected.id, {
      detailIds: refundDetailIds,
      reason: refundReason.trim(),
    })
    if (error) {
      notification('Gagal', error, 'error')
      return
    }
    notification('Berhasil', 'Item berhasil diretur.', 'success')
    setSelected(data)
    setRefundMode(false)
    setRefundDetailIds([])
    setRefundReason('')
    fetchData()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Riwayat Transaksi</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <form onSubmit={onSearchSubmit} className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari no. transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s || 'Semua Status'}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
          {(status || date || search) && (
            <button
              type="button"
              onClick={() => {
                setStatus('')
                setDate('')
                setSearch('')
                setPage(1)
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Reset
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">No.</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Metode</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-400">
                    Memuat...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-400">
                    Tidak ada transaksi.
                  </td>
                </tr>
              ) : (
                transactions.map((trx) => (
                  <tr
                    key={trx.id}
                    onClick={() => openDetail(trx)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-indigo-600">
                      {trx.transactionNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(trx.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {trx.totalQty} item
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                      {formatRupiah(Number(trx.totalPrice))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{trx.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(
                          trx.status,
                        )}`}
                      >
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 text-sm">
            <span className="text-gray-500">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {selected.transactionNo}
                </h3>
                <p className="text-xs text-gray-500">
                  {formatDate(selected.createdAt)} ·{' '}
                  {selected.cashier?.name || selected.cashier?.username || 'Kasir'}
                </p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Status</p>
                  <span
                    className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded-full ${statusBadge(
                      selected.status,
                    )}`}
                  >
                    {selected.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Metode</p>
                  <p className="font-semibold">{selected.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-semibold">
                    {formatRupiah(Number(selected.totalPrice))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Tunai / Kembalian</p>
                  <p className="font-semibold">
                    {formatRupiah(Number(selected.cashAmount))} /{' '}
                    {formatRupiah(Number(selected.changeAmount))}
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Item</p>
                <div className="space-y-2">
                  {(selected.transactionDetails || []).map((d) => {
                    const isSelectable =
                      refundMode && !d.isRefund && selected.status !== 'VOIDED'
                    const checked = refundDetailIds.includes(d.id)
                    return (
                      <div
                        key={d.id}
                        className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${
                          d.isRefund ? 'bg-amber-50 border-amber-200' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {refundMode && (
                            <input
                              type="checkbox"
                              disabled={!isSelectable}
                              checked={checked}
                              onChange={() => toggleRefundDetail(d.id)}
                              className="mt-1"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {d.historicalName}{' '}
                              <span className="text-xs text-gray-500">
                                ({d.historicalPriceName})
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {d.qty} x {formatRupiah(Number(d.historicalPrice))}
                            </p>
                            {d.isRefund && (
                              <p className="text-xs text-amber-700 mt-1">
                                Diretur: {d.refundReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">
                          {formatRupiah(Number(d.historicalPrice) * d.qty)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {refundMode && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Alasan Retur
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="px-6 pb-6 pt-2 flex flex-wrap gap-2 justify-end border-t border-gray-100">
              {selected.status === 'POSTED' && !refundMode && (
                <>
                  <button
                    onClick={onVoid}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium"
                  >
                    <Ban size={14} />
                    Batalkan Transaksi
                  </button>
                  <button
                    onClick={() => setRefundMode(true)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-medium"
                  >
                    <RotateCcw size={14} />
                    Retur Item
                  </button>
                </>
              )}
              {selected.status === 'REFUNDED' && !refundMode && (
                <button
                  onClick={() => setRefundMode(true)}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-medium"
                >
                  <RotateCcw size={14} />
                  Retur Item Lain
                </button>
              )}
              {refundMode && (
                <>
                  <button
                    onClick={() => {
                      setRefundMode(false)
                      setRefundDetailIds([])
                      setRefundReason('')
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={onRefund}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                  >
                    Proses Retur
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
