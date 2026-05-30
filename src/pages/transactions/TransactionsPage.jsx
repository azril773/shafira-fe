import { useEffect, useState } from 'react'
import { Search, X, Ban, RotateCcw } from 'lucide-react'
import { formatRupiah, formatDate, formatNumberId, parseNumberInput } from '../../utils/format'
import AdminVerifyModal from '../../components/globals/AdminVerifyModal'
import {
  searchTransactions,
  voidTransaction,
  refundTransaction,
} from '../../services/transactionService'
import { notification } from '../../utils/toast'
import { useEscClose, backdropMouseDown } from '../../utils/modal'
import PaginationTableNoLink from '../../components/globals/pagination'

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
  const [refundReasonError, setRefundReasonError] = useState(false)
  const [qtyMap, setQtyMap] = useState({})
  const [qtyDrafts, setQtyDrafts] = useState({})
  const [pendingVoid, setPendingVoid] = useState(false)
  const [pendingRefund, setPendingRefund] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
    setRefundReasonError(false)
    setQtyMap({})
    setQtyDrafts({})
  }

  const closeDetail = () => {
    setSelected(null)
    setRefundMode(false)
  }

  useEscClose(closeDetail, !!selected)

  const onVoid = () => {
    if (!selected) return
    setPendingVoid(true)
  }

  const onVoidVerified = async (creds) => {
    setPendingVoid(false)
    setSubmitting(true)
    const { data, error } = await voidTransaction(selected.id, {
      ...(creds?.username ? { verifierUsername: creds.username } : {}),
      ...(creds?.password ? { verifierPassword: creds.password } : {}),
    })
    setSubmitting(false)
    if (error) {
      notification('Gagal', error, 'error')
      return
    }
    notification('Berhasil', 'Transaksi dibatalkan.', 'success')
    setSelected(data)
    fetchData()
  }

  const toggleRefundDetail = (id) => {
    setRefundDetailIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      const d = (selected?.transactionDetails || []).find((x) => x.id === id)
      setQtyMap((qmap) => ({ ...qmap, [id]: qmap[id] ?? (d?.qty || 1) }))
      return [...prev, id]
    })
  }

  const setQtyFor = (id, raw, max) => {
    let next = parseNumberInput(raw)
    if (!Number.isFinite(next) || next <= 0) next = 1
    if (next > max) next = max
    setQtyMap((prev) => ({ ...prev, [id]: next }))
  }

  const onRefund = () => {
    if (!selected) return
    if (refundDetailIds.length === 0) {
      notification('Gagal', 'Pilih minimal satu item untuk diretur.', 'error')
      return
    }
    if (!refundReason.trim()) {
      setRefundReasonError(true)
      return
    }
    setPendingRefund(true)
  }

  const onRefundVerified = async (creds) => {
    setPendingRefund(false)
    setSubmitting(true)
    const items = refundDetailIds.map((id) => ({
      detailId: id,
      qty: qtyMap[id] || 1,
    }))
    const { data, error } = await refundTransaction(selected.id, {
      items,
      reason: refundReason.trim(),
      verifierUsername: creds?.username,
      verifierPassword: creds?.password,
    })
    setSubmitting(false)
    if (error) {
      notification('Gagal', error, 'error')
      return
    }
    notification('Berhasil', 'Item berhasil diretur.', 'success')
    setSelected(data)
    setRefundMode(false)
    setRefundDetailIds([])
    setRefundReason('')
    setRefundReasonError(false)
    setQtyMap({})
    setQtyDrafts({})
    fetchData()
  }

  const refundableDetails = (selected?.transactionDetails || []).filter((d) => !d.isRefund)
  const refundTotal = refundableDetails
    .filter((d) => refundDetailIds.includes(d.id))
    .reduce((sum, d) => sum + Number(d.historicalPrice) * (qtyMap[d.id] || 0), 0)
  const refundTotalQty = refundableDetails
    .filter((d) => refundDetailIds.includes(d.id))
    .reduce((sum, d) => sum + (qtyMap[d.id] || 0), 0)

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
                transactions.map((trx) => {
                  const details = trx.transactionDetails || []
                  const refundedCount = details.filter((d) => d.isRefund).length
                  const hasPartialRefund = refundedCount > 0 && trx.status !== 'REFUNDED' && trx.status !== 'VOIDED'
                  return (
                  <tr
                    key={trx.id}
                    onClick={() => openDetail(trx)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-indigo-600">
                      <div className="flex items-center gap-2 flex-wrap">
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(trx.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {formatNumberId(trx.totalQty)} item
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-gray-200">
            <PaginationTableNoLink
              currentPage={page}
              setCurrentPage={setPage}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onMouseDown={backdropMouseDown(closeDetail)}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-800 text-lg">{selected.transactionNo}</h3>
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
                <p className="text-xs text-gray-500">
                  {formatDate(selected.createdAt)} ·{' '}
                  {selected.cashier?.name || selected.cashier?.username || 'Kasir'}
                </p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {refundMode ? (
              <>
                <div className="px-6 py-4 space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Pilih Item Retur</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-gray-500">
                        <tr className="border-b border-gray-100">
                          <th className="py-2 w-8"></th>
                          <th className="text-left py-2 font-medium">Produk</th>
                          <th className="text-right py-2 font-medium">Tersedia</th>
                          <th className="text-right py-2 font-medium">Qty Retur</th>
                          <th className="text-right py-2 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refundableDetails.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-sm text-gray-400">
                              Tidak ada item yang dapat diretur.
                            </td>
                          </tr>
                        ) : refundableDetails.map((d) => {
                          const checked = refundDetailIds.includes(d.id)
                          const refundQty = qtyMap[d.id] ?? d.qty
                          return (
                            <tr key={d.id} onClick={() => toggleRefundDetail(d.id)} className="border-b border-gray-50 hover:bg-indigo-50/40 cursor-pointer">
                              <td className="py-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleRefundDetail(d.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4"
                                />
                              </td>
                              <td className="py-2 text-gray-700">
                                {d.historicalName}
                                <div className="text-xs text-gray-400">{d.historicalPriceName}</div>
                              </td>
                              <td className="py-2 text-right">{formatNumberId(d.qty, { maximumFractionDigits: 3 })}</td>
                              <td className="py-2 text-right">
                                <input
                                  type="text"
                                  disabled={!checked}
                                  value={qtyDrafts[d.id] ?? formatNumberId(refundQty, { maximumFractionDigits: 3 })}
                                  onFocus={() => setQtyDrafts((prev) => ({ ...prev, [d.id]: refundQty > 0 ? String(refundQty) : '' }))}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    const parsed = parseNumberInput(val)
                                    if (parsed > d.qty) return
                                    setQtyDrafts((prev) => ({ ...prev, [d.id]: val }))
                                  }}
                                  onBlur={(e) => {
                                    setQtyFor(d.id, e.target.value, d.qty)
                                    setQtyDrafts((prev) => { const s = { ...prev }; delete s[d.id]; return s })
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-16 px-2 py-1 border border-gray-200 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-50 disabled:text-gray-400"
                                />
                              </td>
                              <td className="py-2 text-right font-semibold">
                                {formatRupiah(Number(d.historicalPrice) * (checked ? refundQty : 0))}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Alasan Retur</label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => { setRefundReason(e.target.value); setRefundReasonError(false) }}
                      rows={3}
                      placeholder="Mis. produk rusak / salah pilih..."
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                        refundReasonError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                    />
                    {refundReasonError && <p className="mt-1 text-xs text-red-500">Alasan retur harus diisi.</p>}
                  </div>
                </div>
                <div className="px-6 pb-6 pt-3 border-t border-gray-100">
                  <div className="text-sm flex items-center gap-4 mb-3">
                    <span className="text-gray-500">Total Qty: <span className="font-bold text-gray-800">{formatNumberId(refundTotalQty, { maximumFractionDigits: 3 })}</span></span>
                    <span className="text-gray-500">Total Refund: <span className="font-bold text-amber-600">{formatRupiah(refundTotal)}</span></span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setRefundMode(false); setRefundDetailIds([]); setRefundReason(''); setQtyMap({}); setQtyDrafts({}) }}
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Batal
                    </button>
                    <button
                      onClick={onRefund}
                      disabled={submitting || refundDetailIds.length === 0}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {submitting ? 'Memproses...' : 'Proses Retur'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-4 space-y-4 overflow-y-auto">
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
                      {Array.isArray(selected.payments) && selected.payments.length > 1 && (
                        <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                          {selected.payments.map((p, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold text-orange-700">
                                {p.method}
                              </span>
                              <span className="font-semibold text-gray-800">{formatRupiah(Number(p.amount) || 0)}</span>
                              {p.reference && (
                                <span className="text-gray-400">({p.reference})</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
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
                    {(() => {
                      const normalItems = (selected.transactionDetails || []).filter((d) => !d.isRefund)
                      const refundedItems = (selected.transactionDetails || []).filter((d) => d.isRefund)
                      if (normalItems.length === 0 && refundedItems.length === 0) {
                        return <p className="text-sm text-gray-400 text-center py-6">Tidak ada item dalam transaksi ini.</p>
                      }
                      return (
                        <div className="space-y-4">
                          {normalItems.length > 0 && (
                            <div className="space-y-2">
                              {normalItems.map((d) => (
                                <div key={d.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-200">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">
                                      {d.historicalName}{' '}
                                      <span className="text-xs text-gray-500">({d.historicalPriceName})</span>
                                    </p>
                                    {d.historicalBarcode && (
                                      <p className="text-xs text-gray-400 mt-0.5">{d.historicalBarcode}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {formatNumberId(d.qty)}{d.historicalUomCode ? ` ${d.historicalUomCode}` : ''} x {formatRupiah(Number(d.historicalPrice))}
                                    </p>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {formatRupiah(Number(d.historicalPrice) * d.qty)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          {normalItems.length === 0 && refundedItems.length > 0 && (
                            <p className="text-sm text-gray-400 text-center py-2">Semua item telah diretur.</p>
                          )}
                          {refundedItems.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                                <RotateCcw size={11} /> Item Diretur ({refundedItems.length})
                              </p>
                              <div className="space-y-2">
                                {refundedItems.map((d) => (
                                  <div key={d.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-amber-900">
                                        {d.historicalName}{' '}
                                        <span className="text-xs text-amber-700">({d.historicalPriceName})</span>
                                      </p>
                                      {d.historicalBarcode && (
                                        <p className="text-xs text-amber-600 mt-0.5">{d.historicalBarcode}</p>
                                      )}
                                      <p className="text-xs text-amber-700 mt-0.5">
                                        {formatNumberId(d.qty)}{d.historicalUomCode ? ` ${d.historicalUomCode}` : ''} x {formatRupiah(Number(d.historicalPrice))}
                                      </p>
                                      {d.refundReason && (
                                        <p className="text-[11px] text-amber-700 mt-0.5">Alasan: {d.refundReason}</p>
                                      )}
                                    </div>
                                    <p className="text-sm font-semibold text-amber-800">
                                      {formatRupiah(Number(d.historicalPrice) * d.qty)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-gray-100 shrink-0">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {selected.status === 'POSTED' && (
                      <>
                        <button
                          onClick={onVoid}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium disabled:opacity-40"
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
                    {selected.status === 'REFUNDED' && (
                      <button
                        onClick={() => setRefundMode(true)}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-medium"
                      >
                        <RotateCcw size={14} />
                        Retur Item Lain
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {pendingVoid && (
        <AdminVerifyModal
          title="Batalkan Transaksi"
          description={`Membatalkan transaksi ${selected?.transactionNo} memerlukan persetujuan admin. Stok akan dikembalikan.`}
          confirmLabel="Batalkan"
          tone="red"
          onCancel={() => setPendingVoid(false)}
          onVerified={onVoidVerified}
        />
      )}

      {pendingRefund && (
        <AdminVerifyModal
          title="Retur Item"
          description="Mengembalikan barang dan stok memerlukan persetujuan admin."
          confirmLabel="Proses Retur"
          tone="red"
          onCancel={() => setPendingRefund(false)}
          onVerified={onRefundVerified}
        />
      )}
    </div>
  )
}
