import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

export default function NotificationBell({ userId, isAdmin = false }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const loadNotifications = async () => {
    if (!userId) return
    try {
      const items = []

      if (isAdmin) {
        const [metrics] = await Promise.all([
          api.get('/admin/metrics')
        ])
        const m = metrics.data

        const pendingJobs = m.jobs_by_status?.find(s => s.status === 'pending')
        if (pendingJobs && Number(pendingJobs.count) > 0) {
          items.push({ id: 'pending', text: `${pendingJobs.count} pending job${Number(pendingJobs.count) > 1 ? 's' : ''} awaiting action`, type: 'warning' })
        }
        if (Number(m.unread_messages_total) > 0) {
          items.push({ id: 'msgs', text: `${m.unread_messages_total} unread message${Number(m.unread_messages_total) > 1 ? 's' : ''}`, type: 'info' })
        }
        if (Number(m.low_stock_parts_total) > 0) {
          items.push({ id: 'stock', text: `${m.low_stock_parts_total} part${Number(m.low_stock_parts_total) > 1 ? 's' : ''} at low stock`, type: 'danger' })
        }
        if (Number(m.todays_appointments_total) > 0) {
          items.push({ id: 'appts', text: `${m.todays_appointments_total} appointment${Number(m.todays_appointments_total) > 1 ? 's' : ''} today`, type: 'success' })
        }
      } else {
        try {
          const res = await api.get(`/finance/actions/${userId}`)
          const data = res.data
          if (data.pendingQuotes?.length > 0) {
            items.push({ id: 'quotes', text: `${data.pendingQuotes.length} quote${data.pendingQuotes.length > 1 ? 's' : ''} need approval`, type: 'warning' })
          }
          if (data.unpaidInvoices?.length > 0) {
            items.push({ id: 'invoices', text: `${data.unpaidInvoices.length} unpaid invoice${data.unpaidInvoices.length > 1 ? 's' : ''}`, type: 'danger' })
          }
        } catch {}
      }

      setNotifications(items)
    } catch (err) {
      console.error('Failed to load notifications', err)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const count = notifications.length

  const typeColors = {
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    danger: 'border-red-500/20 bg-red-500/10 text-red-300',
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Notifications</p>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">All clear — no alerts right now.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl border p-3 text-sm font-bold ${typeColors[n.type] || typeColors.info}`}
                  >
                    {n.text}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
