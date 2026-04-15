import { createElement } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ShoppingCart,
  Package,
  ReceiptText,
  LayoutDashboard,
  LogOut,
  Clock3,
  CalendarDays,
  Monitor,
  Store,
  Clock,
  Users,
  ShoppingBag,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import logoSecondary from '../../assets/logo-shafira2.png'

const cashierNavItems = [
  { to: '/pos', icon: ShoppingCart, label: 'Kasir' },
  { to: '/products', icon: Package, label: 'Produk' },
  { to: '/transactions', icon: ReceiptText, label: 'Transaksi' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

const inventoryNavItems = [
  { to: '/inventory', icon: Monitor, label: 'Inventory' },
]

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const now = new Date()
  const timeText = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const dateText = now.toLocaleDateString('id-ID')

  const currentNavItems = user?.role === 'inventory' ? inventoryNavItems : cashierNavItems
  const location = useLocation()
  const hideSidebar = location.pathname === '/inventory'

  return (
    <div className="flex h-screen bg-[#f6efe8] overflow-hidden">
      {!hideSidebar && (
        <aside className="w-[260px] border border-orange-100 bg-white shadow-lg flex flex-col overflow-hidden">
        <div className="bg-white p-6">
          <div className="flex items-center justify-center">
            <img src={logoSecondary} alt="ShafiraMart" className="h-24 w-full object-contain" />
          </div>
        </div>

        <div className="rounded-2xl flex-1 bg-orange-500 text-white p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-orange-500">
                <Users size={32} />
              </div>
              <p className="text-lg font-semibold">{user?.name || 'Asep'}</p>
              <p className="text-xs text-orange-100 mt-1 uppercase tracking-[0.2em]">
                {user?.role === 'inventory' ? 'Inventory User' : 'Kasir'}
              </p>
            </div>

            <div className="space-y-4 text-sm text-white/90">
              <div className="flex items-center gap-3">
                <Clock3 size={16} className="text-white/80" />
                <span>{timeText}</span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays size={16} className="text-white/80" />
                <span>{dateText}</span>
              </div>
              <div className="flex items-center gap-3">
                <Store size={16} className="text-white/80" />
                <span>Supermarket</span>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-6">
            <nav className="rounded-[32px] border border-white/20 bg-white/10 p-2 divide-y divide-white/20">
              {currentNavItems.map(({ to, icon, label }, index) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-orange-500'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {createElement(icon, { size: 18 })}
                  {label}
                </NavLink>
              ))}
            </nav>

            <button
              onClick={logout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>
      )}

      <main className="flex-1 overflow-auto bg-[#fffaf6]">
        <Outlet />
      </main>
    </div>
  )
}
