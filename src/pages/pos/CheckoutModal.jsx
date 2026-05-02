import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { formatRupiah } from '../../utils/format'
import { printReceipt, printReceiptQZ, findQzPrinters, isQzLoaded } from '../../utils/receipt'
import { createTransaction } from '../../services/transactionService'
import { notification } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'

const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Kartu Debit']

export default function CheckoutModal({ total, items = [], mode = 'sale', onClose, onSuccess }) {
  const [method, setMethod] = useState('Tunai')
  const [cash, setCash] = useState('')
  const [loading, setLoading] = useState(false)
  const [qzStatus, setQzStatus] = useState('loading')
  const [printerName, setPrinterName] = useState('BSC10')
  const user = useAuthStore((s) => s.user)
  const cashRef = useRef(null)

  const cashNum = Number(cash.replace(/\D/g, ''))
  const change = cashNum - total

  // Autofocus input uang tunai saat metode Tunai dipilih
  useEffect(() => {
    if (method === 'Tunai') {
      const t = setTimeout(() => cashRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [method])

  // Shortcut keyboard checkout
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!loading) onClose()
        return
      }
      // Pintasan metode pembayaran 1-4 (saat tidak fokus pada input uang)
      const tag = (e.target?.tagName || '').toLowerCase()
      const isInput = tag === 'input' || tag === 'textarea'
      if (!isInput && ['1', '2', '3'].includes(e.key)) {
        const idx = Number(e.key) - 1
        if (PAYMENT_METHODS[idx]) {
          e.preventDefault()
          setMethod(PAYMENT_METHODS[idx])
        }
        return
      }
      if (e.key === 'Enter') {
        const disabled = loading || (method === 'Tunai' && cashNum < total)
        if (!disabled) {
          e.preventDefault()
          handlePay()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, cashNum, total, loading])

  useEffect(() => {
    if (typeof window === 'undefined') {
      setQzStatus('noqz')
      return
    }
    if (!isQzLoaded()) {
      setQzStatus('noqz')
      return
    }
    findQzPrinters()
      .then((printers) => {
        if (printers?.length > 0) {
          setPrinterName(printers[0])
          setQzStatus('ready')
        } else {
          setQzStatus('no-printer')
        }
      })
      .catch((error) => {
        console.warn('QZ Tray connect failed:', error)
        setQzStatus('error')
      })
  }, [])

  async function handlePay() {
    if (method === 'Tunai' && cashNum < total) return
    setLoading(true)
    try {
      const payload = {
        paymentMethod: method,
        cashAmount: method === 'Tunai' ? cashNum : total,
        transactionDetails: items.map((it) => ({
          productId: it.id,
          priceName: it.priceName || it.priceLabel || 'Default',
          qty: it.qty,
          ...(it.uomId ? { uomId: it.uomId } : {}),
        })),
      }
      const { data: trx, error } = await createTransaction(payload)
      if (error || !trx) {
        notification('Gagal', error || 'Gagal menyimpan transaksi.', 'error')
        return
      }

      const receiptData = {
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
        paymentMethod: method,
        cash: method === 'Tunai' ? cashNum : total,
        change: method === 'Tunai' ? Math.max(0, cashNum - total) : 0,
      }

      if (qzStatus === 'ready') {
        try {
          await printReceiptQZ(receiptData, printerName)
        } catch (printError) {
          console.error('QZ Tray print error:', printError)
          printReceipt(receiptData)
        }
      } else {
        printReceipt(receiptData)
      }

      notification('Berhasil', `Transaksi ${trx.transactionNo} tersimpan.`, 'success')
      onSuccess()
    } catch (error) {
      console.error(error)
      notification('Gagal', 'Terjadi kesalahan saat memproses transaksi.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg">Pembayaran</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Total */}
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">{mode === 'return' ? 'Total Retur' : 'Total Tagihan'}</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{formatRupiah(total)}</p>
          </div>

          {/* Metode */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`relative py-2 rounded-lg text-sm font-medium border transition-colors ${
                    method === m
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="absolute left-2 top-1 text-[10px] font-bold text-gray-400">{i + 1}</span>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Uang tunai */}
          {method === 'Tunai' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Uang Tunai
              </label>
              <input
                ref={cashRef}
                type="text"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="Masukkan jumlah uang"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {cashNum > 0 && (
                <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {change >= 0
                    ? `Kembalian: ${formatRupiah(change)}`
                    : `Kurang: ${formatRupiah(Math.abs(change))}`}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handlePay}
            disabled={loading || (method === 'Tunai' && cashNum < total)}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : mode === 'return' ? 'Proses Retur' : 'Bayar Sekarang (Enter)'}
          </button>
        </div>
      </div>
    </div>
  )
}
