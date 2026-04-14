import { createElement } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ShoppingCart, Package, Users } from 'lucide-react'
import { formatRupiah } from '../../utils/format'

const salesData = [
  { day: 'Sen', sales: 3250000 },
  { day: 'Sel', sales: 2980000 },
  { day: 'Rab', sales: 3750000 },
  { day: 'Kam', sales: 4100000 },
  { day: 'Jum', sales: 5200000 },
  { day: 'Sab', sales: 6800000 },
  { day: 'Min', sales: 5950000 },
]

const stats = [
  { label: 'Pendapatan Hari Ini', value: formatRupiah(5200000), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Transaksi Hari Ini', value: '87', icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Total SKU Produk', value: '342', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Total Kasir', value: '4', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
]

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              {createElement(icon, { size: 20, className: color })}
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Penjualan 7 Hari Terakhir</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis tickFormatter={(v) => `${v / 1000000}jt`} tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip formatter={(v) => formatRupiah(v)} />
            <Bar dataKey="sales" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
