import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import NotificationBell from '../components/NotificationBell'

/* Sidebar nav icon chip colours */
function NavBadge({ label }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950/40 text-[11px] font-black uppercase tracking-[0.12em] text-slate-200">
      {label}
    </span>
  )
}

export default function AppLayout({ title, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('adminUser') || 'null')
  const isAdmin = !!localStorage.getItem('adminUser') || user?.role === 'admin'
  const isAuthPage =
    location.pathname === '/user/login' ||
    location.pathname === '/user/register' ||
    location.pathname === '/admin/login' ||
    location.pathname === '/admin/register'

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  useEffect(() => {
    if (isAuthPage) return
    if (!user) {
      navigate(location.pathname.startsWith('/admin') ? '/admin/login' : '/user/login', { replace: true })
      return
    }
    if (location.pathname.startsWith('/admin') && !isAdmin) {
      navigate('/user/dashboard', { replace: true })
    }
    if (location.pathname.startsWith('/user') && isAdmin) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isAdmin, isAuthPage, location.pathname, navigate, user])

  const userNav = [
    { name: 'Dashboard', path: '/user/dashboard', badge: 'DB' },
    { name: 'My Vehicles', path: '/user/vehicle', badge: 'VH' },
    { name: 'Book Service', path: '/user/service', badge: 'BK' },
    { name: 'Repair Estimate', path: '/user/estimate', badge: 'ET' },
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
      <aside className="border-b border-white/5 bg-slate-900/60 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="p-6 lg:p-8">
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
        </div>

        <div className="px-4 pb-4 lg:px-4">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {isAdmin ? 'Workshop Admin' : 'Customer Portal'}
          </p>
        </div>

        {/* Nav links: inactive slate vs active cyan/blue gradient strip */}
        <nav className="grid gap-2 px-4 pb-4 md:grid-cols-2 lg:grid-cols-1">
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
                {user?.full_name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{user?.full_name}</p>
                <p className="truncate text-[10px] text-slate-500">{user?.email}</p>
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

      <div className="relative h-screen flex-1 overflow-auto">
        {/* Main content area: soft blue/cyan background glows */}
        <div className="absolute right-0 top-0 -z-10 h-96 w-96 bg-blue-600/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 bg-cyan-400/5 blur-3xl"></div>

        {/* Top bar on each dashboard page */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-slate-950/60 px-6 py-5 backdrop-blur-md lg:px-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{title}</h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">System online</p>
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

        <main className="mx-auto max-w-7xl p-6 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
