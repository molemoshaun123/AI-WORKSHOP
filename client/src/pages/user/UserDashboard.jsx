import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Settings, CheckCircle2, Car, Timer, MessageCircle, Receipt, XCircle } from 'lucide-react'
import UserLayout from '../../layouts/UserLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import BookingHelper from './BookingHelper'
import ConfirmModal from '../../components/ConfirmModal'
import StarRating from '../../components/StarRating'

export default function UserDashboard() {
  const [jobs, setJobs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [vehicleLoading, setVehicleLoading] = useState(true)
  const [historyByJobId, setHistoryByJobId] = useState({})
  const [openHistoryJobId, setOpenHistoryJobId] = useState(null)
  const [actionItems, setActionItems] = useState({ pendingQuotes: [], unpaidInvoices: [] })

  // Modals state
  const [cancellingJob, setCancellingJob] = useState(null)
  const [payingInvoice, setPayingInvoice] = useState(null)

  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const loadActionItems = async () => {
    if (!user) return
    try {
      const res = await api.get(`/finance/actions/${user.user_id}`)
      setActionItems(res.data)
    } catch (e) {}
  }

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
    loadActionItems()
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
      tone: 'bg-orange-50',
      border: 'border-orange-100',
      text: 'text-orange-600',
      iconColor: 'text-orange-500'
    },
    {
      label: 'In Progress',
      value: statusCount('in_progress'),
      icon: <Settings className="w-6 h-6" />,
      tone: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-600',
      iconColor: 'text-blue-500'
    },
    {
      label: 'Completed',
      value: statusCount('completed'),
      icon: <CheckCircle2 className="w-6 h-6" />,
      tone: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
      iconColor: 'text-emerald-500'
    },
    {
      label: 'Vehicles',
      value: vehicles.length,
      icon: <Car className="w-6 h-6" />,
      tone: 'bg-violet-50',
      border: 'border-violet-100',
      text: 'text-violet-600',
      iconColor: 'text-violet-500'
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
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'pending':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'diagnosed':
        return 'bg-violet-100 text-violet-700 border-violet-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200'
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

  const handleQuote = async (quote_id, status) => {
    try {
      await api.put(`/finance/quote/${quote_id}`, { status })
      toast.success(`Quote ${status}!`)
      loadActionItems()
    } catch {
      toast.error('Failed to update quote')
    }
  }

  const handlePayInvoice = async () => {
    if (!payingInvoice) return
    try {
      await api.put(`/finance/invoice/${payingInvoice.invoice_id}`, { status: 'paid' })
      toast.success('Payment successful!')
      loadActionItems()
      loadUserJobs()
    } catch {
      toast.error('Payment failed')
    } finally {
      setPayingInvoice(null)
    }
  }

  const cancelJob = async () => {
    if (!cancellingJob) return
    try {
      await api.put(`/jobs/${cancellingJob.job_id}/cancel`)
      toast.success('Job cancelled')
      loadUserJobs()
    } catch {
      toast.error('Failed to cancel job')
    } finally {
      setCancellingJob(null)
    }
  }

  const rateJob = async (jobId, rating, comment) => {
    try {
      await api.post(`/jobs/${jobId}/rating`, { rating, comment })
      toast.success('Thanks for your feedback!')
      loadUserJobs()
    } catch (e) {
      toast.error('Failed to submit rating')
    }
  }

  const downloadInvoice = (job_id) => {
    navigate(`/user/invoice/${job_id}`)
  }

  return (
    <UserLayout title="Overview">
      <div className="space-y-8">
        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8 space-y-6">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent" />
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-100/50 blur-3xl" />
              <div className="absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-indigo-100/50 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">
                    Welcome Back
                  </div>

                  <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    Hello, {user?.full_name?.split(' ')[0] || 'Driver'}
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    Track your bookings, follow repair progress, view your vehicles, and stay connected with the workshop in one place.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/user/service"
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 hover:-translate-y-0.5"
                    >
                      Book Service
                    </Link>
                    <Link
                      to="/user/estimate"
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 hover:-translate-y-0.5"
                    >
                      Get Estimate
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
                      className={`rounded-[1.5rem] border ${item.border} ${item.tone} p-4`}
                    >
                      <div className={item.iconColor}>{item.icon}</div>
                      <p className={`mt-3 text-3xl font-black ${item.text}`}>{item.value}</p>
                      <p className={`mt-1 text-xs font-black uppercase tracking-[0.15em] ${item.text} opacity-80`}>
                        {item.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Upcoming Booking</p>
                    <h3 className="mt-2 text-xl font-black text-slate-900">
                      {nextBooking ? 'Next Appointment' : 'No Appointment Yet'}
                    </h3>
                  </div>
                  <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                    Booking
                  </div>
                </div>

                <p className="text-sm leading-7 text-slate-600">
                  {nextBooking
                    ? new Date(nextBooking.appointment_date).toLocaleString()
                    : 'Use the booking helper to choose a service and reserve your next visit.'}
                </p>

                {nextBooking && (
                  <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-lg font-black text-slate-900">{nextBooking.title}</p>
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">{nextBooking.symptoms}</p>
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quick Access</p>
                    <h3 className="mt-2 text-xl font-black text-slate-900">My Workspace</h3>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                    Ready
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/user/vehicle"
                    className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100 hover:border-slate-200"
                  >
                    <Car className="w-8 h-8 text-violet-500" />
                    <p className="mt-3 text-base font-black text-slate-900">Vehicles</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {vehicleLoading ? 'Loading...' : `${vehicles.length} saved`}
                    </p>
                  </Link>

                  <Link
                    to="/user/estimate"
                    className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100 hover:border-slate-200"
                  >
                    <Timer className="w-8 h-8 text-orange-500" />
                    <p className="mt-3 text-base font-black text-slate-900">Estimate</p>
                    <p className="mt-1 text-xs text-slate-500">Repair planning</p>
                  </Link>

                  <Link
                    to="/user/diagnosis"
                    className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100 hover:border-slate-200"
                  >
                    <Settings className="w-8 h-8 text-blue-500" />
                    <p className="mt-3 text-base font-black text-slate-900">Vehicle Assistant</p>
                    <p className="mt-1 text-xs text-slate-500">Car diagnostics</p>
                  </Link>

                  <Link
                    to="/inbox"
                    className="rounded-[1.5rem] border border-indigo-100 bg-indigo-50 p-4 transition hover:bg-indigo-100 hover:border-indigo-200"
                  >
                    <MessageCircle className="w-8 h-8 text-indigo-500" />
                    <p className="mt-3 text-base font-black text-slate-900">Messages</p>
                    <p className="mt-1 text-xs text-indigo-600">Talk to workshop</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            
            {/* ACTION NEEDED PANEL */}
            {(actionItems.pendingQuotes.length > 0 || actionItems.unpaidInvoices.length > 0) && (
              <div className="rounded-[2rem] border border-orange-200 bg-orange-50/50 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                  Action Needed
                </h3>
                
                <div className="space-y-4">
                  {actionItems.pendingQuotes.map(q => (
                    <div key={q.quote_id} className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quote Approval</p>
                          <p className="font-bold text-slate-900">{q.title}</p>
                        </div>
                        <p className="text-lg font-black text-orange-600">R{Number(q.amount).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleQuote(q.quote_id, 'approved')} className="flex-1 bg-blue-600 text-white font-bold text-xs py-2 rounded-xl hover:bg-blue-700 transition">Approve</button>
                        <button onClick={() => handleQuote(q.quote_id, 'declined')} className="flex-1 bg-slate-100 text-slate-600 font-bold text-xs py-2 rounded-xl hover:bg-slate-200 transition">Decline</button>
                      </div>
                    </div>
                  ))}

                  {actionItems.unpaidInvoices.map(i => (
                    <div key={i.invoice_id} className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice Due</p>
                          <p className="font-bold text-slate-900">{i.title}</p>
                        </div>
                        <p className="text-lg font-black text-emerald-600">R{Number(i.amount).toFixed(2)}</p>
                      </div>
                      <button onClick={() => setPayingInvoice(i)} className="w-full bg-emerald-600 text-white font-bold text-xs py-2 rounded-xl hover:bg-emerald-700 transition mt-2 flex items-center justify-center gap-2">
                        <Receipt className="w-4 h-4" /> Pay Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <BookingHelper vehicles={vehicles} />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm print:shadow-none print:border-none">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 bg-slate-50">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Service Tracking</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">My Service Jobs</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Live status, mechanic updates, and timeline history for your service requests.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/user/vehicle"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Add Vehicle
              </Link>
              <Link
                to="/user/service"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
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
                  className="animate-pulse rounded-[2rem] border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="h-6 w-1/3 rounded bg-slate-200" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
                  <div className="mt-6 h-2 w-full rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 text-center flex flex-col items-center justify-center bg-white"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 mb-6">
                <Car className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">No service jobs yet</p>
              <p className="mt-3 text-sm text-slate-500 max-w-sm">
                Start by adding a vehicle and booking your first service request. We'll track every step here.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  to="/user/vehicle"
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 shadow-sm"
                >
                  Add Vehicle
                </Link>
                <Link
                  to="/user/service"
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                >
                  Book Service
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-5 p-6 sm:p-8 bg-white">
              {jobs.map((job) => {
                const progress = getProgress(job.status)

                return (
                  <div
                    key={job.job_id}
                    className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-6 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className={`absolute left-0 top-0 h-full w-1.5 ${job.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h4 className="text-xl font-black text-slate-900">{job.title}</h4>

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

                        <p className="line-clamp-2 text-sm font-semibold leading-7 text-slate-600">
                          {job.symptoms}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          <span>ID #{job.job_id}</span>
                          <span>•</span>
                          <span>Created {new Date(job.created_at).toLocaleDateString()}</span>

                          {job.appointment_date && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">
                                Booked {new Date(job.appointment_date).toLocaleString()}
                              </span>
                            </>
                          )}

                          {job.mechanic_name && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600">Mechanic {job.mechanic_name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-4 lg:max-w-[220px] lg:items-end">
                        <div className="w-full">
                          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                job.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 lg:justify-end">
                          <Link
                            to="/inbox"
                            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 transition hover:bg-blue-100"
                          >
                            <MessageCircle className="w-3 h-3" />
                            Message Workshop
                          </Link>

                          <button
                            type="button"
                            onClick={() => toggleHistory(job.job_id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                          >
                            <Receipt className="w-3 h-3" />
                            {openHistoryJobId === job.job_id ? 'Hide Timeline' : 'View Timeline'}
                          </button>
                          
                          {job.status === 'completed' && (
                              <button
                                type="button"
                                onClick={() => downloadInvoice(job.job_id)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                              >
                                Print Invoice
                              </button>
                          )}

                          {job.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => setCancellingJob(job)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-600 transition hover:bg-red-100 shadow-sm"
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel Job
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {job.status === 'completed' && !job.rating && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm font-bold text-slate-900 mb-2">Rate your experience</p>
                        <StarRating 
                          initialRating={0} 
                          onSubmit={(rating, comment) => rateJob(job.job_id, rating, comment)} 
                          readonly={false} 
                        />
                      </div>
                    )}
                    {job.status === 'completed' && job.rating && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm font-bold text-slate-900 mb-2">Your Rating</p>
                        <StarRating 
                          initialRating={job.rating} 
                          readonly={true} 
                        />
                      </div>
                    )}

                    <AnimatePresence>
                    {openHistoryJobId === job.job_id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 overflow-hidden shadow-sm">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Job Timeline
                            </p>
                            <h5 className="mt-2 text-lg font-black text-slate-900">Recent Activity</h5>
                          </div>

                          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                            {(historyByJobId[job.job_id] || []).length} events
                          </div>
                        </div>

                        {(historyByJobId[job.job_id] || []).length === 0 ? (
                          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <p className="text-sm font-bold text-slate-500">No timeline events yet.</p>
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
                                  className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-sm font-black text-slate-900">{h.status}</p>
                                      <p className="mt-1 text-xs font-bold text-slate-500">
                                        {h.changed_by_name || 'Workshop'} •{' '}
                                        {new Date(h.changed_at).toLocaleString()}
                                      </p>
                                    </div>

                                    {h.notes && (
                                      <p className="max-w-xl text-sm font-semibold text-slate-600 sm:text-right">
                                        {h.notes}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {h.image_url && (
                                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                                      <img src={h.image_url} alt="Timeline update" className="w-full h-auto max-h-64 object-cover" />
                                    </div>
                                  )}
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

      <ConfirmModal
        isOpen={!!cancellingJob}
        onClose={() => setCancellingJob(null)}
        onConfirm={cancelJob}
        title="Cancel Service Request"
        message={`Are you sure you want to cancel the service request for "${cancellingJob?.title}"?`}
        confirmText="Cancel Job"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        onConfirm={handlePayInvoice}
        title="Secure Payment"
        message={`Authorize payment of R${Number(payingInvoice?.amount).toFixed(2)} for ${payingInvoice?.title}? This will instantly settle your invoice.`}
        confirmText="Pay Securely"
        isDanger={false}
      />
    </UserLayout>
  )
}