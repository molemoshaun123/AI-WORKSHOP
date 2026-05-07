import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { Clock, Brain, Settings, CheckCircle2, ClipboardList, Wrench, Palette, Package, Users } from 'lucide-react'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

export default function AdminDashboard() {
  const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')

  const { data: metrics, isLoading: loading } = useQuery({
    queryKey: ['adminMetrics'],
    queryFn: async () => {
      const res = await api.get('/admin/metrics')
      return res.data
    }
  })

  const countByStatus = (status) => {
    const row = metrics?.jobs_by_status?.find((s) => s.status === status)
    return Number(row?.count || 0)
  }

  const totals = useMemo(() => {
    const pending = countByStatus('pending')
    const diagnosed = countByStatus('diagnosed')
    const inProgress = countByStatus('in_progress')
    const completed = countByStatus('completed')
    const total = pending + diagnosed + inProgress + completed

    return {
      pending,
      diagnosed,
      inProgress,
      completed,
      total,
    }
  }, [metrics])

  const chartData = useMemo(() => [
    { name: 'Pending', value: totals.pending || 0, color: '#fbbf24' },
    { name: 'Diagnosed', value: totals.diagnosed || 0, color: '#a855f7' },
    { name: 'In Progress', value: totals.inProgress || 0, color: '#3b82f6' },
    { name: 'Completed', value: totals.completed || 0, color: '#10b981' }
  ], [totals])

  const progressWidth = (value) => {
    if (!totals.total) return '0%'
    return `${Math.max(8, Math.round((value / totals.total) * 100))}%`
  }

  const statCards = [
    {
      title: 'Pending Jobs',
      value: totals.pending,
      icon: <Clock className="w-6 h-6" />,
      tone: 'from-amber-500/20 to-orange-500/10',
      border: 'border-amber-400/20',
      text: 'text-amber-300',
      bar: 'bg-amber-400',
    },
    {
      title: 'Diagnosed',
      value: totals.diagnosed,
      icon: <Brain className="w-6 h-6" />,
      tone: 'from-violet-500/20 to-fuchsia-500/10',
      border: 'border-violet-400/20',
      text: 'text-violet-300',
      bar: 'bg-violet-400',
    },
    {
      title: 'In Progress',
      value: totals.inProgress,
      icon: <Settings className="w-6 h-6" />,
      tone: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-400/20',
      text: 'text-blue-300',
      bar: 'bg-blue-400',
    },
    {
      title: 'Completed',
      value: totals.completed,
      icon: <CheckCircle2 className="w-6 h-6" />,
      tone: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-400/20',
      text: 'text-emerald-300',
      bar: 'bg-emerald-400',
    },
  ]

  const actionCards = [
    {
      to: '/admin/jobs',
      title: 'Job Management',
      desc: 'View, assign, prioritize, and update all active service jobs across the workshop.',
      icon: <ClipboardList className="w-8 h-8" />,
      accent: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-400/20',
      text: 'text-emerald-300',
      button: 'Open Job List',
    },
    {
      to: '/admin/ai',
      title: 'Workshop Tools',
      desc: 'Run vehicle diagnostics, photo checks, customer updates, and planning helpers.',
      icon: <Wrench className="w-8 h-8" />,
      accent: 'from-violet-500/20 to-indigo-500/10',
      border: 'border-violet-400/20',
      text: 'text-violet-300',
      button: 'Open Tools',
    },
    {
      to: '/admin/ai/colour-identification',
      title: 'Colour Recognition',
      desc: 'Upload a paint photo to get a color match and mixing guidance.',
      icon: <Palette className="w-8 h-8" />,
      accent: 'from-pink-500/20 to-purple-600/10',
      border: 'border-purple-400/20',
      text: 'text-purple-300',
      button: 'Open Tool',
    },
    {
      to: '/admin/inventory',
      title: 'Inventory',
      desc: 'Track parts, low-stock alerts, supplier orders, and stock movement in one place.',
      icon: <Package className="w-8 h-8" />,
      accent: 'from-cyan-500/20 to-sky-500/10',
      border: 'border-cyan-400/20',
      text: 'text-cyan-300',
      button: 'Open Inventory',
    },
  ]

  return (
    <AppLayout title="Workshop Control">
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-slate-900/80 p-8 shadow-2xl sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_30%)]" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                </span>
                Workshop command center
              </div>

              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Welcome back, {admin?.full_name?.split(' ')[0] || 'Team'}
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/80 sm:text-base">
                Manage operations, monitor repair activity, track customers, and use built-in tools to keep the workshop fast, organized, and modern.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Jobs</p>
                <p className="mt-3 text-3xl font-black text-white">{totals.total}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending</p>
                <p className="mt-3 text-3xl font-black text-amber-300">{totals.pending}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">In Progress</p>
                <p className="mt-3 text-3xl font-black text-blue-300">{totals.inProgress}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Completed</p>
                <p className="mt-3 text-3xl font-black text-emerald-300">{totals.completed}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4 space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Quick Overview</p>
                  <h3 className="mt-2 text-xl font-black text-white">Job Status</h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Live
                </div>
              </div>

              <div className="space-y-4">
                {statCards.map((card, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    key={card.title}
                    className={`rounded-[1.5rem] border bg-gradient-to-br ${card.tone} ${card.border} p-4`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-xl">
                          {card.icon}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{card.title}</p>
                          <p className={`text-xs font-bold ${card.text}`}>{card.value} jobs</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-black text-white">{card.value}</p>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${card.bar} transition-all duration-700`}
                        style={{ width: progressWidth(card.value) }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-400/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl sm:p-8">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System Status</p>
                  <h4 className="mt-2 text-xl font-black text-white">Assistant Tools Online</h4>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                    Active
                  </span>
                </div>
              </div>

              <p className="text-sm leading-7 text-slate-400">
                Diagnostics, scheduling helpers, parts compatibility, customer updates, tire checks, and image-based analysis tools are ready for use.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Models Ready</p>
                  <p className="mt-2 text-2xl font-black text-white">6+</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Availability</p>
                  <p className="mt-2 text-2xl font-black text-emerald-300">24/7</p>
                </div>
              </div>

              <Link
                to="/admin/ai"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                View Tools
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="xl:col-span-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {actionCards.map((card, i) => (
                <motion.div
                  key={card.to}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="h-full"
                >
                  <Link
                    to={card.to}
                    className={`block h-full group rounded-[2rem] border ${card.border} bg-gradient-to-br ${card.accent} p-6 shadow-2xl transition duration-300 hover:-translate-y-1`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-3xl transition duration-300 group-hover:scale-110">
                    {card.icon}
                  </div>

                  <h3 className="mt-6 text-2xl font-black tracking-tight text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300/80">{card.desc}</p>

                  <div className={`mt-6 inline-flex items-center gap-2 text-sm font-black ${card.text}`}>
                    {card.button}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Workshop Flow</p>
                <h3 className="mt-2 mb-6 text-xl font-black text-white">Live Job Distribution</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Appointments</p>
                  <p className="mt-2 text-3xl font-black text-white">{Number(metrics?.todays_appointments_total || 0)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Scheduled for today</p>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Low Stock</p>
                  <p className="mt-2 text-3xl font-black text-amber-300">{Number(metrics?.low_stock_parts_total || 0)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">At or below reorder</p>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Messages</p>
                  <p className="mt-2 text-3xl font-black text-cyan-300">{Number(metrics?.unread_messages_total || 0)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Across active chats</p>
                </div>
              </div>
            </div>

            <Link
              to="/admin/customers"
              className="group flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 sm:flex-row sm:items-center sm:justify-between sm:p-8"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-3xl">
                  <Users className="w-8 h-8 text-blue-300" />
                </div>
                <div>
                  <h4 className="text-2xl font-black tracking-tight text-white">Customer Database</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Manage users, profiles, linked vehicles, and workshop customer history.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition group-hover:bg-white/10">
                View Customers
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </Link>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Latest Activity</p>
                  <h4 className="mt-2 text-2xl font-black text-white">Recent Jobs</h4>
                </div>
                <Link
                  to="/admin/jobs"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-slate-300 transition hover:bg-white/10"
                >
                  Open all jobs
                  <span>→</span>
                </Link>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5"
                    >
                      <div className="h-5 w-1/3 rounded bg-white/10" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-white/10" />
                      <div className="mt-4 h-3 w-1/4 rounded bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : (metrics?.recent_jobs || []).length > 0 ? (
                <div className="space-y-4">
                  {(metrics?.recent_jobs || []).slice(0, 6).map((j, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={j.job_id}
                      className="group flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5 transition hover:bg-slate-950/60 hover:border-emerald-500/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-white group-hover:text-emerald-400 transition-colors">{j.title}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-400">
                          {j.customer_name} • {j.make} {j.model} ({j.registration_number})
                        </p>
                        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          Job #{j.job_id}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          j.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' :
                          j.status === 'pending' ? 'border-amber-500/20 bg-amber-500/10 text-amber-300' :
                          'border-white/10 bg-white/5 text-slate-300'
                        }`}>
                          {j.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/30 p-12 text-center flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-white/5 mb-4">
                    <ClipboardList className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-lg font-black text-slate-300">No jobs yet</p>
                  <p className="mt-2 text-sm text-slate-500 max-w-xs">
                    Once service requests are created by customers, recent activity will appear here.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}