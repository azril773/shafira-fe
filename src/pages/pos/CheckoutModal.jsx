import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { formatRupiah } from '../../utils/format'
import { printReceipt, printReceiptQZ, findQzPrinters, isQzLoaded } from '../../utils/receipt'

const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Kartu Debit', 'Kartu Kredit']

export default function CheckoutModal({ total, items = [], mode = 'sale', onClose, onSuccess }) {
  const [method, setMethod] = useState('Tunai')
  const [cash, setCash] = useState('')
  const [loading, setLoading] = useState(false)
  const [qzStatus, setQzStatus] = useState('loading')
  const [printerName, setPrinterName] = useState('BSC10')

  const cashNum = Number(cash.replace(/\D/g, ''))
  const change = cashNum - total

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
      // await transactionService.create({ items, total, paymentMethod: method })
      await new Promise((r) => setTimeout(r, 600)) // simulasi

      const receiptData = {
        receiptId: `TRX-${Date.now()}`,
        date: new Date().toLocaleString('id-ID'),
        cashier: 'Kasir',
        items,
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
          alert('Gagal mencetak lewat QZ Tray. Menggunakan print browser sebagai fallback.')
          printReceipt(receiptData)
        }
      } else {
        if (qzStatus === 'loading') {
          console.warn('QZ Tray masih loading, menggunakan browser print sebagai fallback.')
        }
        printReceipt(receiptData)
      }

      onSuccess()
    } catch (error) {
      console.error('Print error:', error)
      if (qzStatus === 'noqz' || qzStatus === 'no-printer' || qzStatus === 'error') {
        alert('QZ Tray tidak tersedia atau tidak terhubung. Mencetak lewat browser print sebagai fallback.')
        printReceipt({
          receiptId: `TRX-${Date.now()}`,
          date: new Date().toLocaleString('id-ID'),
          cashier: 'Kasir',
          items,
          subtotal: total,
          total,
          paymentMethod: method,
          cash: method === 'Tunai' ? cashNum : total,
          change: method === 'Tunai' ? Math.max(0, cashNum - total) : 0,
        })
      } else {
        alert('Terjadi masalah saat mengirim ke printer. Periksa QZ Tray.')
      }
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
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    method === m
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
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
            {loading ? 'Memproses...' : mode === 'return' ? 'Proses Retur' : 'Bayar Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}
