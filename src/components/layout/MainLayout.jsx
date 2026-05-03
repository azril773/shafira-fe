import { createElement, useState } from 'react'
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
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import logoSecondary from '../../assets/logo-shafira2.png'
import { CASHIER } from '../../constants/user'

const cashierNavItems = [
  { to: '/pos/kasir', icon: ShoppingCart, label: 'Kasir' },
  { to: '/pos/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

const inventoryNavItems = [
  { to: '/inventory/dashboard', icon: Monitor, label: 'Inventory' },
  { to: '/inventory/purchase', icon: ShoppingBag, label: 'Purchase' },
  { to: '/inventory/transactions', icon: ReceiptText, label: 'Transaksi' },
]

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const now = new Date()
  const timeText = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const dateText = now.toLocaleDateString('id-ID')

  const currentNavItems = user?.role === CASHIER ? cashierNavItems : inventoryNavItems
  const location = useLocation()
  const hideSidebar = location.pathname === '/inventory'

  const SidebarContent = () => (
    <>
      <div className="bg-white p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <img src={logoSecondary} alt="ShafiraMart" className="h-16 lg:h-24 w-full object-contain" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl flex-1 bg-orange-500 text-white p-4 lg:p-6 flex flex-col justify-between">
        <div className="space-y-4 lg:space-y-6">
          <div>
            <div className="mx-auto mb-3 lg:mb-4 flex h-16 w-16 lg:h-20 lg:w-20 items-center justify-center rounded-full bg-white text-orange-500">
              <Users size={28} />
            </div>
            <p className="text-base lg:text-lg font-semibold">{user?.name || 'Asep'}</p>
            <p className="text-xs text-orange-100 mt-1 uppercase tracking-[0.2em]">
              {user?.role === CASHIER ? 'Kasir' : 'Inventory User'}
            </p>
          </div>

          <div className="space-y-3 text-sm text-white/90">
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

        <div className="mt-auto space-y-4 lg:space-y-6">
          <nav className="rounded-[32px] border border-white/20 bg-white/10 p-2 divide-y divide-white/20">
            {currentNavItems.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
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
    </>
  )

  return (
    <div className="flex h-screen bg-[#f6efe8] overflow-hidden">
      {!hideSidebar && (
        <>
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex w-[260px] border border-orange-100 bg-white shadow-lg flex-col overflow-hidden">
            <SidebarContent />
          </aside>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Mobile sidebar drawer */}
          <aside
            className={`fixed top-0 left-0 z-50 h-full w-[260px] border-r border-orange-100 bg-white shadow-lg flex flex-col overflow-hidden transition-transform duration-300 lg:hidden ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      <main className="flex-1 overflow-auto bg-[#fffaf6] min-w-0">
        {/* Mobile top bar */}
        {!hideSidebar && (
          <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-orange-100 sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-orange-600 hover:bg-orange-50"
            >
              <Menu size={22} />
            </button>
            <img src={logoSecondary} alt="ShafiraMart" className="h-8 object-contain" />
            <div className="text-xs text-gray-500 text-right">
              <div className="font-semibold text-gray-700">{user?.name || 'Kasir'}</div>
              <div>{timeText}</div>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
