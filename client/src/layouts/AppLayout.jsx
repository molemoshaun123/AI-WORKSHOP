import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import { Menu, X } from 'lucide-react'

/* Sidebar nav icon chip colours */
function NavBadge({ label }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950/40 text-[11px] font-black uppercase tracking-[0.12em] text-slate-200">
      {label}
    </span>
  )
}

export default function AppLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, admin, isAdmin, logout } = useAuth()
  const activeUser = admin || user
  const isAuthPage =
    location.pathname === '/user/login' ||
    location.pathname === '/user/register' ||
    location.pathname === '/admin/login' ||
    location.pathname === '/admin/register'

  const handleLogout = () => {
    logout()
  }

  useEffect(() => {
    if (isAuthPage) return
    if (!activeUser) {
      navigate(location.pathname.startsWith('/admin') ? '/admin/login' : '/user/login', { replace: true })
      return
    }
    if (location.pathname.startsWith('/admin') && !isAdmin) {
      navigate('/user/dashboard', { replace: true })
    }
    if (location.pathname.startsWith('/user') && isAdmin) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isAdmin, isAuthPage, location.pathname, navigate, activeUser])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const userNav = [
    { name: 'Dashboard', path: '/user/dashboard', badge: 'DB' },
    { name: 'My Vehicles', path: '/user/vehicle', badge: 'VH' },
    { name: 'Book Service', path: '/user/service', badge: 'BK' },
    { name: 'Car Value', path: '/user/car-value', badge: 'CV' },
    { name: 'Messages', path: '/inbox', badge: 'MS' },
  ]

  const adminNav = [
    { name: 'Overview', path: '/admin/dashboard', badge: 'OV' },
    { name: 'Job Management', path: '/admin/jobs', badge: 'JB' },
    { name: 'Workshop Tools', path: '/admin/ai', badge: 'AI' },
    { name: 'Customers', path: '/admin/customers', badge: 'CU' },
    { name: 'Inventory', path: '/admin/inventory', badge: 'IN' },
    { name: 'Messages', path: '/inbox', badge: 'MS' },
  ]

  const navItems = isAdmin ? adminNav : userNav

  /* Login/register pages: plain dark backdrop (each auth page adds its own accents) */
  if (isAuthPage) {
    return <div className="min-h-screen bg-slate-950 text-white">{children}</div>
  }

  /* Dashboard + portal shell: sidebar, main area, header, decorative glows */
  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/5 bg-slate-900/95 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 lg:p-8">
          <Link to="/" className="group flex items-center gap-3">
            {/* Brand mark: cyan → blue gradient */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-transform group-hover:scale-105">
              K
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Workshop System</p>
              <h1 className="text-xl font-black tracking-tight">AUTO TUNE</h1>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-4 lg:px-4">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {isAdmin ? 'Workshop Admin' : 'Customer Portal'}
          </p>
        </div>

        {/* Nav links: inactive slate vs active cyan/blue gradient strip */}
        <nav className="grid gap-2 px-4 pb-4">
          {navItems.map((item) => {
            const isDashboard = item.path === '/admin/dashboard' || item.path === '/user/dashboard'
            const active = isDashboard ? location.pathname === item.path : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 rounded-2xl border px-4 py-4 text-sm font-bold transition-all ${
                  active
                    ? 'border-cyan-400/20 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                    : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                <NavBadge label={item.badge} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/5 p-6 lg:mt-auto">
          {/* User card + avatar gradient */}
          <div className="mb-4 rounded-2xl border border-white/5 bg-slate-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-xs font-black">
                {activeUser?.full_name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{activeUser?.full_name}</p>
                <p className="truncate text-[10px] text-slate-500">{activeUser?.email}</p>
              </div>
            </div>
          </div>
          {/* Logout: destructive red accent */}
          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-xs font-bold text-red-400 transition hover:bg-red-500/20"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="relative min-h-screen flex-1 overflow-auto lg:h-screen">
        {/* Main content area: soft blue/cyan background glows */}
        <div className="absolute right-0 top-0 -z-10 h-96 w-96 bg-blue-600/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 bg-cyan-400/5 blur-3xl"></div>

        {/* Top bar on each dashboard page */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-slate-950/60 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 backdrop-blur-md sm:px-6 sm:py-5 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h2>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:mt-1 sm:text-xs">System online</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="hidden items-center gap-3 sm:flex">
              {/* “Live” status dot */}
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Live workspace
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
