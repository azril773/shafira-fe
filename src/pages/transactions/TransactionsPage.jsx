import { Search } from 'lucide-react'
import { formatRupiah, formatDate } from '../../utils/format'
import { useState } from 'react'
import { useAppStore } from '../../store/appStore'

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const { transactions } = useAppStore()

  const filtered = transactions.filter((t) =>
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
