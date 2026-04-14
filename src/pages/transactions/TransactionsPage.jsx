import { Search } from 'lucide-react'
import { formatRupiah, formatDate } from '../../utils/format'
import { useState } from 'react'

const DUMMY_TRANSACTIONS = [
  { id: 'TRX-001', date: '2026-04-08T08:12:00', items: 5,  total: 42500,  method: 'Tunai',        status: 'Selesai' },
  { id: 'TRX-002', date: '2026-04-08T08:47:00', items: 3,  total: 97000,  method: 'QRIS',         status: 'Selesai' },
  { id: 'TRX-003', date: '2026-04-08T09:20:00', items: 8,  total: 183500, method: 'Tunai',        status: 'Selesai' },
  { id: 'TRX-004', date: '2026-04-08T10:05:00', items: 2,  total: 11000,  method: 'Tunai',        status: 'Selesai' },
  { id: 'TRX-005', date: '2026-04-08T10:33:00', items: 6,  total: 134000, method: 'Kartu Debit',  status: 'Selesai' },
  { id: 'TRX-006', date: '2026-04-08T11:15:00', items: 4,  total: 56500,  method: 'QRIS',         status: 'Selesai' },
  { id: 'TRX-007', date: '2026-04-08T12:02:00', items: 10, total: 247000, method: 'Kartu Kredit', status: 'Selesai' },
  { id: 'TRX-008', date: '2026-04-08T12:45:00', items: 1,  total: 3500,   method: 'Tunai',        status: 'Void'    },
  { id: 'TRX-009', date: '2026-04-08T13:30:00', items: 7,  total: 158500, method: 'QRIS',         status: 'Selesai' },
  { id: 'TRX-010', date: '2026-04-08T14:10:00', items: 3,  total: 44500,  method: 'Tunai',        status: 'Selesai' },
  { id: 'TRX-011', date: '2026-04-08T14:19:00', items: 3,  total: 80000,  method: 'Tunai',        status: 'Abort' },
]

export default function TransactionsPage() {
  const [search, setSearch] = useState('')

  const filtered = DUMMY_TRANSACTIONS.filter((t) =>
    t.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Riwayat Transaksi</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari ID transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Metode</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((trx) => (
              <tr key={trx.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-indigo-600">{trx.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(trx.date)}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{trx.items} item</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-800">{formatRupiah(trx.total)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{trx.method}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    trx.status === 'Selesai' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {trx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
