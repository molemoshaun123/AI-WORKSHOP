import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Settings, CheckCircle2, Car, Timer, MessageCircle, Receipt } from 'lucide-react'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'
import BookingHelper from './BookingHelper'

export default function UserDashboard() {
  const [jobs, setJobs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [vehicleLoading, setVehicleLoading] = useState(true)
  const [historyByJobId, setHistoryByJobId] = useState({})
  const [openHistoryJobId, setOpenHistoryJobId] = useState(null)

  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const loadUserJobs = async () => {
    if (!user) {
      navigate('/user/login', { replace: true })
      return
    }

    try {
      const res = await api.get(`/jobs/user/${user.user_id}`)
      setJobs(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setJobs([])
      console.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const loadVehicles = async () => {
      if (!user) return

      try {
        const res = await api.get(`/vehicles/user/${user.user_id}`)
        setVehicles(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        setVehicles([])
      } finally {
        setVehicleLoading(false)
      }
    }

    loadVehicles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nextBooking = useMemo(() => {
    return jobs
      .filter((j) => j.appointment_date)
      .map((j) => ({ ...j, appointment_ts: new Date(j.appointment_date).getTime() }))
      .sort((a, b) => a.appointment_ts - b.appointment_ts)[0]
  }, [jobs])

  const statusCount = (status) => jobs.filter((j) => j.status === status).length

  const dashboardStats = [
    {
      label: 'Pending',
      value: statusCount('pending'),
      icon: <Clock className="w-6 h-6" />,
      tone: 'from-amber-500/20 to-orange-500/10',
      border: 'border-amber-400/20',
      text: 'text-amber-300',
    },
    {
      label: 'In Progress',
      value: statusCount('in_progress'),
      icon: <Settings className="w-6 h-6" />,
      tone: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-400/20',
      text: 'text-blue-300',
    },
    {
      label: 'Completed',
      value: statusCount('completed'),
      icon: <CheckCircle2 className="w-6 h-6" />,
      tone: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-400/20',
      text: 'text-emerald-300',
    },
    {
      label: 'Vehicles',
      value: vehicles.length,
      icon: <Car className="w-6 h-6" />,
      tone: 'from-violet-500/20 to-fuchsia-500/10',
      border: 'border-violet-400/20',
      text: 'text-violet-300',
    },
  ]

  const toggleHistory = async (jobId) => {
    if (openHistoryJobId === jobId) {
      setOpenHistoryJobId(null)
      return
    }

    setOpenHistoryJobId(jobId)

    if (historyByJobId[jobId]) return

    try {
      const res = await api.get(`/jobs/${jobId}/history`)
      setHistoryByJobId((prev) => ({ ...prev, [jobId]: res.data }))
    } catch (e) {
      setHistoryByJobId((prev) => ({ ...prev, [jobId]: [] }))
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      case 'pending':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
      case 'diagnosed':
        return 'bg-violet-500/10 text-violet-300 border-violet-500/20'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20'
      default:
        return 'bg-white/5 text-slate-300 border-white/10'
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/20'
      case 'high':
        return 'bg-red-500/10 text-red-300 border-red-500/20'
      case 'medium':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
      default:
        return 'bg-white/5 text-slate-300 border-white/10'
    }
  }

  const getProgress = (status) => {
    switch (status) {
      case 'pending':
        return 20
      case 'diagnosed':
        return 40
      case 'in_progress':
        return 70
      case 'completed':
        return 100
      default:
        return 10
    }
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8">
        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8 space-y-6">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-slate-900/80 p-8 shadow-2xl sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_30%)]" />
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
                    Customer portal
                  </div>

                  <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                    Welcome back, {user?.full_name?.split(' ')[0] || 'Driver'}
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/80 sm:text-base">
                    Track your bookings, follow repair progress, view your vehicles, and stay connected with the workshop in one place.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/user/service"
                      className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                      Book Service
                    </Link>
                    <Link
                      to="/user/estimate"
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
                    >
                      Get Estimate
                    </Link>
                    <Link
                      to="/inbox"
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
                    >
                      Open Messages
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {dashboardStats.map((item, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      key={item.label}
                      className={`rounded-[1.5rem] border ${item.border} bg-gradient-to-br ${item.tone} p-4 backdrop-blur-xl`}
                    >
                      <div className="text-xl">{item.icon}</div>
                      <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
                      <p className={`mt-1 text-xs font-black uppercase tracking-[0.15em] ${item.text}`}>
                        {item.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Upcoming Booking</p>
                    <h3 className="mt-2 text-xl font-black text-white">
                      {nextBooking ? 'Next Appointment' : 'No Appointment Yet'}
                    </h3>
                  </div>
                  <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                    Booking
                  </div>
                </div>

                <p className="text-sm leading-7 text-slate-400">
                  {nextBooking
                    ? new Date(nextBooking.appointment_date).toLocaleString()
                    : 'Use the booking helper to choose a service and reserve your next visit.'}
                </p>

                {nextBooking && (
                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-lg font-black text-white">{nextBooking.title}</p>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2">{nextBooking.symptoms}</p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/user/service"
                    className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                  >
                    Book Now
                  </Link>
                  <Link
                    to="/user/vehicle"
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
                  >
                    My Vehicles
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Quick Access</p>
                    <h3 className="mt-2 text-xl font-black text-white">My Workspace</h3>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                    Ready
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/user/vehicle"
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <Car className="w-8 h-8 text-violet-300" />
                    <p className="mt-3 text-base font-black text-white">Vehicles</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {vehicleLoading ? 'Loading...' : `${vehicles.length} saved`}
                    </p>
                  </Link>

                  <Link
                    to="/user/estimate"
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <Timer className="w-8 h-8 text-amber-300" />
                    <p className="mt-3 text-base font-black text-white">Estimate</p>
                    <p className="mt-1 text-xs text-slate-400">Repair planning</p>
                  </Link>

                  <Link
                    to="/user/diagnosis"
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <Settings className="w-8 h-8 text-blue-300" />
                    <p className="mt-3 text-base font-black text-white">Vehicle Assistant</p>
                    <p className="mt-1 text-xs text-slate-400">Car diagnostics & guidance</p>
                  </Link>

                  <Link
                    to="/inbox"
                    className="rounded-[1.5rem] border border-blue-400/20 bg-blue-500/10 p-4 transition hover:bg-blue-500/20"
                  >
                    <MessageCircle className="w-8 h-8 text-blue-400" />
                    <p className="mt-3 text-base font-black text-white">Messages</p>
                    <p className="mt-1 text-xs text-blue-300">Talk to workshop</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <BookingHelper vehicles={vehicles} />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Service Tracking</p>
              <h3 className="mt-2 text-2xl font-black text-white">My Service Jobs</h3>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                Live status, mechanic updates, and timeline history for your service requests.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/user/vehicle"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Add Vehicle
              </Link>
              <Link
                to="/user/service"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-500"
              >
                Book Service
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-8">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-[2rem] border border-white/10 bg-slate-950/30 p-6"
                >
                  <div className="h-6 w-1/3 rounded bg-white/10" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-white/10" />
                  <div className="mt-6 h-2 w-full rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 text-center flex flex-col items-center justify-center"
            >
              <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20 mb-6">
                <Car className="w-12 h-12 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white">No service jobs yet</p>
              <p className="mt-3 text-sm text-slate-500 max-w-sm">
                Start by adding a vehicle and booking your first service request. We'll track every step here.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  to="/user/vehicle"
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10 hover:-translate-y-0.5"
                >
                  Add Vehicle
                </Link>
                <Link
                  to="/user/service"
                  className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 hover:-translate-y-0.5 shadow-lg shadow-cyan-400/20"
                >
                  Book Service
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-5 p-6 sm:p-8">
              {jobs.map((job) => {
                const progress = getProgress(job.status)

                return (
                  <div
                    key={job.job_id}
                    className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/30 p-6 transition hover:bg-slate-950/50"
                  >
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-cyan-400" />

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h4 className="text-xl font-black text-white">{job.title}</h4>

                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getPriorityBadge(job.priority)}`}
                          >
                            {job.priority || 'normal'}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusBadge(job.status)}`}
                          >
                            {job.status}
                          </span>
                        </div>

                        <p className="line-clamp-2 text-sm font-semibold leading-7 text-slate-300/80">
                          {job.symptoms}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          <span>ID #{job.job_id}</span>
                          <span>•</span>
                          <span>Created {new Date(job.created_at).toLocaleDateString()}</span>

                          {job.appointment_date && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-300">
                                Booked {new Date(job.appointment_date).toLocaleString()}
                              </span>
                            </>
                          )}

                          {job.mechanic_name && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-300">Mechanic {job.mechanic_name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-4 lg:max-w-[220px] lg:items-end">
                        <div className="w-full">
                          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                job.status === 'completed' ? 'bg-emerald-400' : 'bg-cyan-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 lg:justify-end">
                          <Link
                            to="/inbox"
                            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300 transition hover:bg-cyan-500/20"
                          >
                            <MessageCircle className="w-3 h-3" />
                            Message Workshop
                          </Link>

                          <button
                            type="button"
                            onClick={() => toggleHistory(job.job_id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition hover:bg-white/10 hover:text-white"
                          >
                            <Receipt className="w-3 h-3" />
                            {openHistoryJobId === job.job_id ? 'Hide Timeline' : 'View Timeline'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                    {openHistoryJobId === job.job_id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-5 overflow-hidden">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                              Job Timeline
                            </p>
                            <h5 className="mt-2 text-lg font-black text-white">Recent Activity</h5>
                          </div>

                          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                            {(historyByJobId[job.job_id] || []).length} events
                          </div>
                        </div>

                        {(historyByJobId[job.job_id] || []).length === 0 ? (
                          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/20 p-6 text-center">
                            <p className="text-sm font-bold text-slate-400">No timeline events yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(historyByJobId[job.job_id] || [])
                              .slice()
                              .reverse()
                              .slice(0, 8)
                              .map((h) => (
                                <div
                                  key={h.history_id}
                                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-sm font-black text-white">{h.status}</p>
                                      <p className="mt-1 text-xs font-bold text-slate-400">
                                        {h.changed_by_name || 'Workshop'} •{' '}
                                        {new Date(h.changed_at).toLocaleString()}
                                      </p>
                                    </div>

                                    {h.notes && (
                                      <p className="max-w-xl text-sm font-semibold text-slate-300/80 sm:text-right">
                                        {h.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}