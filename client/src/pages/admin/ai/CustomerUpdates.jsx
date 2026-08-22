import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'
import JobContextPanel from './JobContextPanel'


export default function CustomerUpdates() {
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState('')
  const [status, setStatus] = useState('in_progress')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/jobs')
        setJobs(res.data)
        if (res.data.length) setJobId(res.data[0].job_id)
      } catch (e) {
        setJobs([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const generate = async () => {
    if (!jobId) return
    setGenerating(true)
    try {
      const res = await api.post('/ai/customer-update', { job_id: jobId, new_status: status })
      let data = res.data?.result
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setResult(data)
    } catch (e) {
      toast.error('Failed to generate update')
    } finally {
      setGenerating(false)
    }
  }

  const copy = async () => {
    if (!result?.message) return
    try {
      await navigator.clipboard.writeText(
        `${result.message}\n\nETA: ${result.eta_text || ''}\nNext: ${(result.next_steps || []).join(', ')}`
      )
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed')
    }
  }

  const sendToCustomer = async () => {
    if (!result?.message || !jobId) return
    try {
      const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
      const selectedJob = jobs.find((j) => String(j.job_id) === String(jobId))
      if (!selectedJob || !admin) return toast.error('Missing job or admin data')

      const fullMessage = `📋 Status Update: ${status.replace(/_/g, ' ').toUpperCase()}\n\n${result.message}${result.eta_text ? `\n\nETA: ${result.eta_text}` : ''}${(result.next_steps || []).length ? `\n\nNext Steps:\n${result.next_steps.map((s) => `• ${s}`).join('\n')}` : ''}`

      await api.post('/messages', {
        sender_id: admin.user_id,
        receiver_id: selectedJob.user_id,
        job_id: selectedJob.job_id,
        content: fullMessage,
      })
      toast.success('Update sent to customer inbox!')
    } catch (e) {
      toast.error('Failed to send message')
    }
  }

  return (
    <AppLayout title="Customer Update Generator">
      <JobContextPanel />
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-white/5 mb-6"></div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Generate Update</h3>
          <p className="text-slate-300/70 font-semibold mb-8">Create a customer-friendly status update with ETA and next steps.</p>

          {loading ? (
            <div className="text-slate-400 font-bold">Loading jobs...</div>
          ) : (
            <div className="space-y-4">
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
              >
                {jobs.map((j) => (
                  <option key={j.job_id} value={j.job_id}>
                    #{j.job_id} • {j.title}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
              >
                {['pending', 'diagnosed', 'in_progress', 'completed'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <button
                onClick={generate}
                disabled={generating || !jobId}
                className="w-full bg-amber-500 text-slate-950 font-black py-4 rounded-2xl hover:bg-amber-400 transition-all disabled:opacity-60"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black">Output</h3>
            <div className="flex gap-3">
              <button
                onClick={sendToCustomer}
                disabled={!result?.message}
                className="px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 transition-all disabled:opacity-60"
              >
                📨 Send to Customer
              </button>
              <button
                onClick={copy}
                disabled={!result?.message}
                className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 font-black hover:bg-white/10 transition-all disabled:opacity-60"
              >
                Copy
              </button>
            </div>
          </div>

          {!result ? (
            <div className="h-64 flex items-center justify-center text-slate-500 font-bold">Generate an update to see output.</div>
          ) : (
            <div className="space-y-5">
              <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Message</p>
                <p className="text-slate-200 font-semibold leading-relaxed">{result.message}</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">ETA</p>
                <p className="text-white font-black">{result.eta_text || '—'}</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Next Steps</p>
                {(result.next_steps || []).length === 0 ? (
                  <p className="text-slate-500 font-bold">—</p>
                ) : (
                  <div className="space-y-2">
                    {result.next_steps.slice(0, 6).map((s, idx) => (
                      <p key={idx} className="text-slate-300/80 font-semibold text-sm">
                        • {s}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

