import { createElement } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
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

const navItems = [
  { to: '/pos', icon: ShoppingCart, label: 'Kasir' },
  { to: '/products', icon: Package, label: 'Produk' },
  { to: '/transactions', icon: ReceiptText, label: 'Transaksi' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const now = new Date()
  const timeText = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const dateText = now.toLocaleDateString('id-ID')

  return (
    <div className="flex h-screen bg-[#f6efe8] overflow-hidden">
      <aside className="w-[260px] rounded-[40px] border border-orange-100 bg-white shadow-lg p-6">
        <div className="rounded-[40px] bg-white p-5 shadow-lg mb-6">
          <div className="flex items-center justify-center">
            <img src={logoSecondary} alt="ShafiraMart" className="h-24 w-full object-contain" />
          </div>
        </div>

        <div className="rounded-[40px] bg-orange-500 text-white shadow-xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="rounded-[32px] bg-white/10 p-6 text-center shadow-inner">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-orange-500">
                <Users size={32} />
              </div>
              <p className="text-lg font-semibold">{user?.name || 'Asep'}</p>
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
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">P</span>
                <span>POS 001</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">S</span>
                <span>Shift 1</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">R</span>
                <span>RCP 000006</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <nav className="mt-6 space-y-1.5">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-orange-500'
                    : 'text-orange-600 hover:bg-orange-100 hover:text-orange-700'
                }`
              }
            >
              {createElement(icon, { size: 18 })}
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-[#fffaf6]">
        <Outlet />
      </main>
    </div>
  )
}
