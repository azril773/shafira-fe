import { useState } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { formatRupiah } from '../../utils/format'

const DUMMY_PRODUCTS = [
  { id: 1,  name: 'Indomie Goreng',        price: 3500,  category: 'Mie Instan',   stock: 200 },
  { id: 2,  name: 'Indomie Kuah',          price: 3500,  category: 'Mie Instan',   stock: 180 },
  { id: 3,  name: 'Aqua 600ml',            price: 4000,  category: 'Minuman',      stock: 300 },
  { id: 4,  name: 'Teh Botol Sosro',       price: 5500,  category: 'Minuman',      stock: 150 },
  { id: 5,  name: 'Pocari Sweat 500ml',    price: 8500,  category: 'Minuman',      stock: 120 },
  { id: 6,  name: 'Chitato Sapi Panggang', price: 10000, category: 'Snack',        stock: 80  },
  { id: 7,  name: 'Silverqueen 65gr',      price: 15000, category: 'Snack',        stock: 60  },
  { id: 8,  name: 'Beras 5kg',             price: 75000, category: 'Sembako',      stock: 50  },
  { id: 9,  name: 'Minyak Goreng 2L',      price: 38000, category: 'Sembako',      stock: 40  },
  { id: 10, name: 'Gula 1kg',              price: 18000, category: 'Sembako',      stock: 60  },
  { id: 11, name: 'Sabun Mandi Lifebuoy',  price: 5500,  category: 'Perawatan',    stock: 90  },
  { id: 12, name: 'Deterjen Rinso 800gr',  price: 22000, category: 'Kebersihan',   stock: 45  },
  { id: 13, name: 'Tisu Paseo 250 Sheet',  price: 14000, category: 'Kebersihan',   stock: 55  },
  { id: 14, name: 'Roti Tawar Sari Roti',  price: 16000, category: 'Roti & Susu', stock: 30  },
  { id: 15, name: 'Susu Ultra Milk 250ml', price: 5500,  category: 'Roti & Susu', stock: 120 },
]

export default function ProductsPage() {
  const [search, setSearch] = useState('')

  const filtered = DUMMY_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Produk</h2>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{product.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{formatRupiah(product.price)}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${product.stock > 20 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg">
                      <Pencil size={15} />
                    </button>
                    <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
