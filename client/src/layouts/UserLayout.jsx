import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Car, Wrench, Receipt, MessageCircle, Home } from 'lucide-react'

export default function UserLayout({ title, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('adminUser') || 'null')
  const isAdmin = !!localStorage.getItem('adminUser') || user?.role === 'admin'
  const isAuthPage =
    location.pathname === '/user/login' ||
    location.pathname === '/user/register'

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  useEffect(() => {
    if (isAuthPage) return
    if (!user) {
      navigate('/user/login', { replace: true })
      return
    }
    if (isAdmin && !location.pathname.startsWith('/admin')) {
      // If admin somehow ended up here, redirect them to admin dash or let them browse?
      // Actually, if they are admin, they shouldn't use UserLayout, but let's just allow it for now or redirect
      // navigate('/admin/dashboard', { replace: true })
    }
  }, [isAdmin, isAuthPage, location.pathname, navigate, user])

  const userNav = [
    { name: 'Dashboard', path: '/user/dashboard', icon: <Home className="w-4 h-4" /> },
    { name: 'My Vehicles', path: '/user/vehicle', icon: <Car className="w-4 h-4" /> },
    { name: 'Book Service', path: '/user/service', icon: <Wrench className="w-4 h-4" /> },
    { name: 'Estimates', path: '/user/estimate', icon: <Receipt className="w-4 h-4" /> },
    { name: 'AI Assistant', path: '/user/diagnosis', icon: <MessageCircle className="w-4 h-4" /> },
    { name: 'History', path: '/user/history', icon: <Receipt className="w-4 h-4" /> },
    { name: 'Inbox', path: '/inbox', icon: <MessageCircle className="w-4 h-4" /> },
  ]

  if (isAuthPage) {
    return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-105">
                K
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600">Auto Tune</p>
                <h1 className="text-xl font-black tracking-tight text-slate-900">Customer Portal</h1>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {userNav.map((item) => {
                const active = location.pathname.startsWith(item.path) && item.path !== '/'
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all relative ${
                      active
                        ? 'bg-blue-50 text-blue-700 shadow-inner'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    {item.name === 'Inbox' && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4">
              <Link to="/user/profile" className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-black shadow-inner">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-bold text-slate-800">{user?.full_name || 'User'}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar (Logo & Profile only) */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4 flex justify-between items-center h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black shadow-md">
            K
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Auto Tune</h1>
          </div>
        </Link>
        <div className="flex gap-2">
          <Link to="/user/profile" className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-black shadow-inner">
            {user?.full_name?.charAt(0) || 'U'}
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe">
        <div className="flex justify-around items-center h-16">
          {userNav.map((item) => {
            const active = location.pathname.startsWith(item.path) && item.path !== '/'
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center w-full h-full gap-1 ${
                  active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-bold">{item.name}</span>
                {item.name === 'Inbox' && (
                  <span className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page Title Header */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{title}</h2>
        </div>
        
        {children}
      </main>
      
      {/* Simple Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm font-semibold text-slate-400">
          © {new Date().getFullYear()} Auto Tune Workshop. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
