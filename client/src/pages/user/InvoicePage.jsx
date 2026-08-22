import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import UserLayout from '../../layouts/UserLayout'
import toast from 'react-hot-toast'

export default function InvoicePage() {
  const { job_id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [history, setHistory] = useState([])
  const [finances, setFinances] = useState({ quotes: [], invoices: [] })
  const [loading, setLoading] = useState(true)

  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    if (!user) {
      navigate('/user/login', { replace: true })
      return
    }

    const loadInvoiceData = async () => {
      try {
        // 1. Get user jobs to find this specific one
        const jobsRes = await api.get(`/jobs/user/${user.user_id}`)
        const foundJob = jobsRes.data.find(j => String(j.job_id) === String(job_id))
        
        if (!foundJob) {
          toast.error('Invoice not found')
          navigate('/user/dashboard')
          return
        }
        setJob(foundJob)

        // 2. Get history
        const historyRes = await api.get(`/jobs/${job_id}/history`)
        setHistory(historyRes.data)

        // 3. Get finances
        const financeRes = await api.get(`/finance/job/${job_id}`)
        setFinances(financeRes.data)

      } catch (err) {
        toast.error('Failed to load invoice details')
      } finally {
        setLoading(false)
      }
    }

    loadInvoiceData()
  }, [job_id, navigate, user])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <UserLayout title="Invoice">
        <div className="flex items-center justify-center p-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </UserLayout>
    )
  }

  if (!job) return null

  const latestInvoice = finances.invoices?.[0]
  const latestQuote = finances.quotes?.[0]

  return (
    <UserLayout title={`Invoice #${job.job_id}`}>
      {/* Non-printable header actions */}
      <div className="mb-8 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/user/dashboard')}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl print:m-0 print:max-w-full print:rounded-none print:border-none print:shadow-none">
        
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 p-8 sm:p-12 print:bg-transparent">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <span className="text-xl font-black">AI</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Workshop</h1>
              </div>
              <p className="text-sm font-semibold text-slate-500">123 Mechanics Way<br/>Tech District, NY 10001</p>
            </div>
            
            <div className="sm:text-right">
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Invoice</h2>
              <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-widest">Job #{job.job_id}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">Date: {new Date().toLocaleDateString()}</p>
              
              {latestInvoice ? (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Final Invoice {latestInvoice.status === 'paid' ? '(PAID)' : '(UNPAID)'}
                </div>
              ) : latestQuote ? (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-700">
                  <AlertCircle className="h-3 w-3" />
                  Estimated Quote
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12 grid gap-12">
          {/* Customer & Vehicle Info */}
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-2">Customer Details</h3>
              <p className="text-lg font-bold text-slate-900">{user.full_name}</p>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
              <p className="mt-1 text-sm text-slate-600">{user.phone || 'No phone provided'}</p>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-2">Vehicle Details</h3>
              <p className="text-lg font-bold text-slate-900">{job.make} {job.model}</p>
              <p className="mt-1 text-sm text-slate-600">Reg: <span className="font-semibold text-slate-900">{job.registration_number || 'N/A'}</span></p>
              <p className="mt-1 text-sm text-slate-600">Job Status: <span className="font-bold text-blue-600 uppercase tracking-wider text-xs">{job.status}</span></p>
              <p className="mt-1 text-sm text-slate-600 italic">"{job.title}"</p>
            </div>
          </div>

          {/* Pricing Table */}
          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Financial Summary</h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-black">Description</th>
                    <th className="px-6 py-4 font-black text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latestQuote && (
                    <tr>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">Initial Quote</span>
                        <p className="text-xs text-slate-500 mt-1">Status: {latestQuote.status}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-600">
                        R{Number(latestQuote.amount).toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {latestInvoice && (
                    <tr>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">Final Invoice</span>
                        <p className="text-xs text-slate-500 mt-1">Status: {latestInvoice.status}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-lg">
                        R{Number(latestInvoice.amount).toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {!latestQuote && !latestInvoice && (
                    <tr>
                      <td colSpan="2" className="px-6 py-8 text-center text-slate-500 italic">
                        No financial records found for this job yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Job History / Timeline */}
          <div>
            <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Service Timeline History</h3>
            <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-8">
              {history.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No timeline events recorded.</p>
              ) : (
                history.map((event, index) => (
                  <div key={event.history_id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-white bg-blue-500 shadow-sm" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">{event.status.replace('_', ' ')}</h4>
                      <span className="text-xs font-semibold text-slate-400">{new Date(event.changed_at).toLocaleString()}</span>
                    </div>
                    
                    {event.notes && (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                        {event.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </UserLayout>
  )
}
