import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { formatNumberId, formatRupiah, parseNumberInput } from '../../utils/format'
import { printReceipt, printReceiptQZ, findQzPrinters, isQzLoaded } from '../../utils/receipt'
import { createTransaction, PAYMENT_METHODS } from '../../services/transactionService'
import { notification } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'
import { STORE_NAME, STORE_ADDRESS, STORE_PHONE } from '../../constants/store'
import { backdropMouseDown } from '../../utils/modal'

export default function CheckoutModal({ total, items = [], mode = 'sale', onClose, onSuccess }) {
  // payments array: { method, amount, tendered, reference }
  // Default amount sengaja kosong agar kasir mengisi sendiri uang yang diterima.
  const [payments, setPayments] = useState([
    { method: 'Tunai', amount: '', tendered: '', reference: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [showChange, setShowChange] = useState(false)
  const [qzStatus, setQzStatus] = useState('loading')
  const [printerName, setPrinterName] = useState('BSC10')
  const user = useAuthStore((s) => s.user)
  const firstInputRef = useRef(null)

  const paidTotal = useMemo(
    () =>
      payments.reduce(
        (s, p) => s + (Number(parseNumberInput(p.amount)) || 0),
        0,
      ),
    [payments],
  )
  const cashRow = payments.find((p) => p.method === 'Tunai')
  const cashAmount = cashRow ? Number(parseNumberInput(cashRow.amount)) || 0 : 0
  const change = Math.max(0, paidTotal - total)
  const balanceLeft = total - paidTotal

  const canPay =
    paidTotal >= total &&
    payments.every((p) => Number(parseNumberInput(p.amount)) > 0)

  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (showChange) { onSuccess(); return }
        if (!loading) onClose()
        return
      }
      if (e.key === 'Enter') {
        if (showChange) { e.preventDefault(); onSuccess(); return }
        if (canPay && !loading) {
          e.preventDefault()
          handlePay()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPay, loading, showChange])

  useEffect(() => {
    if (typeof window === 'undefined' || !isQzLoaded()) {
      setQzStatus('noqz')
      return
    }
    findQzPrinters()
      .then((printers) => {
        if (printers?.length > 0) {
          setPrinterName(printers[0])
          setQzStatus('ready')
        } else setQzStatus('no-printer')
      })
      .catch(() => setQzStatus('error'))
  }, [])

  const updateRow = (idx, patch) => {
    setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  }

  const addRow = () => {
    if (payments.length >= PAYMENT_METHODS.length) return
    const used = new Set(payments.map((p) => p.method))
    const next = PAYMENT_METHODS.find((m) => !used.has(m)) || PAYMENT_METHODS[0]
    // Biarkan kosong agar kasir mengisi nominal sendiri.
    setPayments((prev) => [
      ...prev,
      { method: next, amount: '', tendered: '', reference: '' },
    ])
  }

  const removeRow = (idx) => {
    setPayments((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== idx),
    )
  }

  async function handlePay() {
    if (!canPay) return
    setLoading(true)
    try {
      const payloadPayments = payments.map((p) => {
        const amount = Number(parseNumberInput(p.amount)) || 0
        return {
          method: p.method,
          amount,
          tendered: amount,
          ...(p.reference ? { reference: p.reference } : {}),
        }
      })

      const payload = {
        payments: payloadPayments,
        paymentMethod: payments.length > 1 ? 'SPLIT' : payments[0].method,
        cashAmount: cashAmount,
        transactionDetails: items.map((it) => ({
          productId: it.id,
          priceName: it.priceName || it.priceLabel || 'Default',
          qty: Number(it.qty),
          ...(it.uomId ? { uomId: it.uomId } : {}),
        })),
      }
      const { data: trx, error } = await createTransaction(payload)
      if (error || !trx) {
        notification('Gagal', error || 'Gagal menyimpan transaksi.', 'error')
        return
      }

      const receiptData = {
        storeName: STORE_NAME,
        storeAddress: STORE_ADDRESS,
        storePhone: STORE_PHONE,
        receiptId: trx.transactionNo,
        date: new Date(trx.createdAt || Date.now()).toLocaleString('id-ID'),
        cashier: user?.name || user?.username || 'Kasir',
        items: items.map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
          priceLabel: it.priceLabel,
          uomCode: it.uomCode,
        })),
        subtotal: total,
        total,
        paymentMethod:
          payments.length > 1 ? 'Split Payment' : payments[0].method,
        payments: payloadPayments,
        cash: cashAmount,
        change: Math.max(0, change),
      }

      if (qzStatus === 'ready') {
        try {
          await printReceiptQZ(receiptData, printerName)
        } catch {
          printReceipt(receiptData)
        }
      } else {
        printReceipt(receiptData)
      }

      notification('Berhasil', `Transaksi ${trx.transactionNo} tersimpan.`, 'success')
      if (change > 0) {
        setShowChange(true)
      } else {
        onSuccess()
      }
    } catch (error) {
      console.error(error)
      notification('Gagal', 'Terjadi kesalahan saat memproses transaksi.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onMouseDown={backdropMouseDown(onClose, !loading)}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg">Pembayaran</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">
              {mode === 'return' ? 'Total Retur' : 'Total Tagihan'}
            </p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">
              {formatRupiah(total)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-gray-500">Dibayar</p>
              <p className="font-semibold text-gray-800">
                {formatRupiah(paidTotal)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-gray-500">{balanceLeft >= 0 ? 'Sisa' : 'Lebih'}</p>
              <p
                className={`font-semibold ${
                  Math.abs(balanceLeft) < 0.01
                    ? 'text-green-600'
                    : balanceLeft > 0
                      ? 'text-orange-600'
                      : 'text-red-600'
                }`}
              >
                {formatRupiah(Math.abs(balanceLeft))}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-gray-500">Kembalian</p>
              <p
                className={`font-semibold ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatRupiah(Math.max(0, change))}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {payments.map((p, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 p-3 space-y-2 bg-white"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={p.method}
                    onChange={(e) => updateRow(idx, { method: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {payments.length > 1 && (
                    <button
                      onClick={() => removeRow(idx)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      title="Hapus baris"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className={`grid gap-2 ${p.method === 'Tunai' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <label className="block">
                    <span className="text-[11px] font-medium text-gray-500">
                      Uang Diterima
                    </span>
                    <input
                      ref={idx === 0 ? firstInputRef : null}
                      type="text"
                      value={
                        typeof p.amount === 'number'
                          ? formatNumberId(p.amount, { maximumFractionDigits: 0 })
                          : p.amount
                      }
                      onChange={(e) => updateRow(idx, { amount: e.target.value })}
                      onBlur={(e) => {
                        const n = parseNumberInput(e.target.value)
                        updateRow(idx, { amount: n })
                      }}
                      className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </label>
                  {p.method !== 'Tunai' && (
                    <label className="block">
                      <span className="text-[11px] font-medium text-gray-500">
                        No. Referensi (opsional)
                      </span>
                      <input
                        type="text"
                        value={p.reference}
                        onChange={(e) =>
                          updateRow(idx, { reference: e.target.value })
                        }
                        placeholder="No. approval / EDC / TRX"
                        className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>

          {payments.length < PAYMENT_METHODS.length && (
            <button
              onClick={addRow}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            >
              <Plus size={14} /> Tambah Metode Pembayaran (Split)
            </button>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handlePay}
            disabled={loading || !canPay}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Memproses...'
              : mode === 'return'
                ? 'Proses Retur'
                : 'Bayar Sekarang (Enter)'}
          </button>
          {!canPay && (
            <p className="text-center text-xs text-gray-500 mt-2">
              {'Total pembayaran harus sama dengan atau melebihi tagihan.'}
            </p>
          )}
        </div>
      </div>
    </div>

    {showChange && (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs text-center">
          <p className="text-sm text-gray-500 mb-1">Kembalian</p>
          <p className="text-5xl font-bold text-green-600 mb-6">
            {formatRupiah(change)}
          </p>
          <button
            onClick={onSuccess}
            autoFocus
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            OK (Enter)
          </button>
        </div>
      </div>
    )}
    </>
  )
}
