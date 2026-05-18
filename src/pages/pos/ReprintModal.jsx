import { useEffect, useState } from 'react'
import { Search, Printer, X } from 'lucide-react'
import { formatDate, formatNumberId, formatRupiah } from '../../utils/format'
import { searchTransactions } from '../../services/transactionService'
import { notification } from '../../utils/toast'
import { printReceipt } from '../../utils/receipt'
import { STORE_NAME, STORE_ADDRESS, STORE_PHONE } from '../../constants/store'

export default function ReprintModal({ onClose }) {
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [includeAll, setIncludeAll] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await searchTransactions({
      page: 1,
      ...(includeAll ? {} : { status: 'POSTED' }),
      transactionNo: query.trim() || undefined,
      date: date || undefined,
    })
    if (error) {
      notification('Gagal', error, 'error')
      setLoading(false)
      return
    }
    setTransactions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeAll])

  const onSubmit = (e) => {
    e.preventDefault()
    load()
  }

  const handleReprint = (trx) => {
    const items = (trx.transactionDetails || []).map((d) => ({
      name: d.historicalName,
      qty: d.qty,
      price: Number(d.historicalPrice),
      uomCode: d.historicalUomCode,
    }))
    printReceipt({
      storeName: STORE_NAME,
      storeAddress: STORE_ADDRESS,
      storePhone: STORE_PHONE,
      receiptId: trx.transactionNo,
      date: formatDate(trx.createdAt),
      cashier: trx.cashier?.name || trx.cashier?.username || 'Kasir',
      items,
      subtotal: Number(trx.totalPrice),
      total: Number(trx.totalPrice),
      paymentMethod: trx.paymentMethod || 'Tunai',
      cash: Number(trx.cashAmount || 0),
      change: Number(trx.changeAmount || 0),
    })
    notification('Berhasil', `Struk ${trx.transactionNo} dikirim ke printer.`, 'success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-3xl rounded-[32px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Reprint Struk</h3>
            <p className="mt-1 text-sm text-gray-500">
              Cari transaksi selesai lalu pilih struk untuk dicetak ulang.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-orange-50 p-2 text-gray-500 hover:bg-orange-100"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_120px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-orange-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="No transaksi..."
              className="w-full rounded-full border border-orange-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-full border border-orange-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            type="submit"
            className="rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Cari
          </button>
        </form>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIncludeAll((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              includeAll
                ? 'border-orange-400 bg-orange-500 text-white'
                : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            {includeAll ? 'Semua Status (aktif)' : 'Hanya Selesai'}
          </button>
          <span className="text-xs text-gray-400">
            {includeAll ? 'Menampilkan semua transaksi termasuk Refunded & Voided' : 'Hanya transaksi berstatus Selesai'}
          </span>
        </div>

        <div className="mt-5 max-h-[420px] overflow-y-auto rounded-3xl border border-orange-100">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-500">Memuat data...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Transaksi tidak ditemukan.</div>
          ) : (
            <div className="divide-y divide-orange-50">
              {transactions.map((trx) => (
                <div key={trx.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{trx.transactionNo}</p>
                      {trx.status && trx.status !== 'POSTED' && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          trx.status === 'REFUNDED' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {trx.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(trx.createdAt)} · Qty {formatNumberId(trx.totalQty)} · {formatRupiah(Number(trx.totalPrice))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReprint(trx)}
                    className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                  >
                    <Printer size={14} /> Reprint
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
