import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

export default function AdminAIHub() {
  const [approvedJobs, setApprovedJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [updateNotes, setUpdateNotes] = useState('')
  const [updateStatus, setUpdateStatus] = useState('diagnosed')

  const loadApprovedJobs = async () => {
    try {
      const res = await api.get('/jobs/approved-for-ai')
      setApprovedJobs(res.data)
    } catch (e) {
      toast.error('Failed to load approved jobs')
    }
  }

  useEffect(() => {
    loadApprovedJobs()
  }, [])

  const handleUpdateJob = async () => {
    if (!selectedJob) return
    try {
      const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
      await api.put(`/jobs/${selectedJob.job_id}`, {
        status: updateStatus,
        notes: updateNotes,
        changed_by: admin?.user_id || null
      })
      toast.success('Job timeline updated!')
      setUpdateNotes('')
      setSelectedJob(null)
      loadApprovedJobs()
    } catch (e) {
      toast.error('Failed to update job')
    }
  }
  const models = [
    {
      title: 'Fault Diagnosis',
      desc: 'Enter symptoms and get an inspection plan with priority guidance.',
      to: '/admin/ai/fault-diagnosis',
      accent: 'from-purple-500/20 to-blue-600/20',
    },
    {
      title: 'Colour Identification',
      desc: 'Upload a paint photo to identify the colour and provide mixing guidance.',
      to: '/admin/ai/colour-identification',
      accent: 'from-pink-500/20 to-purple-600/20',
    },
    {
      title: 'Parts Decision (Photo)',
      desc: 'Upload a part photo and decide whether it is repairable or must be replaced.',
      to: '/admin/ai/damage-triage',
      accent: 'from-orange-500/20 to-red-600/20',
    },
    {
      title: 'Tire Condition',
      desc: 'Upload a tire photo and determine if it is serviceable or needs replacement.',
      to: '/admin/ai/tire-assessment',
      accent: 'from-emerald-500/20 to-teal-600/20',
    },
    {
      title: 'Audio Engine Diagnostics',
      desc: 'Record or upload engine/exhaust audio and let AI identify possible mechanical faults by sound.',
      to: '/admin/ai/audio-diagnostics',
      accent: 'from-rose-500/20 to-orange-600/20',
    },
    {
      title: 'Parts Compatibility + Alternatives',
      desc: 'Check fitment likelihood and recommend in-stock alternatives.',
      to: '/admin/ai/parts-compatibility',
      accent: 'from-cyan-500/20 to-blue-600/20',
    },
    {
      title: 'Smart Scheduling',
      desc: 'Recommend job order and predict completion dates.',
      to: '/admin/ai/smart-scheduling',
      accent: 'from-indigo-500/20 to-purple-600/20',
    },
    {
      title: 'Customer Updates',
      desc: 'Generate professional customer updates with ETA and next steps.',
      to: '/admin/ai/customer-updates',
      accent: 'from-amber-500/20 to-orange-600/20',
    },
    {
      title: 'Repair Cost Estimator',
      desc: 'Estimate labor, parts, and total cost ranges before final inspection.',
      to: '/admin/ai/repair-cost-estimator',
      accent: 'from-emerald-500/20 to-lime-600/20',
    },
    {
      title: 'Job Card Summarizer',
      desc: 'Convert rough booking notes into a technician-ready service brief.',
      to: '/admin/ai/job-card-summarizer',
      accent: 'from-fuchsia-500/20 to-rose-600/20',
    },
    {
      title: 'Conversation Summarizer',
      desc: 'Summarize customer chats into action items, follow-ups, and reply suggestions.',
      to: '/admin/ai/conversation-summarizer',
      accent: 'from-sky-500/20 to-indigo-600/20',
    },
    {
      title: 'Stock Forecasting',
      desc: 'Predict parts demand, flag at-risk inventory, and get AI-powered reorder recommendations.',
      to: '/admin/ai/stock-forecasting',
      accent: 'from-teal-500/20 to-blue-600/20',
    },
    {
      title: 'Supplier Marketplace',
      desc: 'Compare prices across 5 supplier shops and order parts from the best deal.',
      to: '/admin/ai/supplier-marketplace',
      accent: 'from-orange-500/20 to-purple-600/20',
    },
  ]

  return (
    <AppLayout title="Workshop Tools">
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-violet-500/15 via-slate-900/80 to-cyan-500/10 p-8 shadow-2xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
                AI toolkit
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Faster diagnostics, clearer communication, sharper workshop decisions
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/80 sm:text-base">
                Use the built-in tools to inspect faults, analyze photos, estimate costs, summarize work orders,
                and keep customers informed with less manual effort.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tools</p>
                <p className="mt-2 text-3xl font-black text-white">{models.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Diagnostics</p>
                <p className="mt-2 text-3xl font-black text-cyan-300">4</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Planning</p>
                <p className="mt-2 text-3xl font-black text-emerald-300">3</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Comms</p>
                <p className="mt-2 text-3xl font-black text-amber-300">2</p>
              </div>
            </div>
          </div>
        </section>

        {/* Approved Jobs Section */}
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h3 className="text-2xl font-black text-white">Approved Jobs (Pending AI Check)</h3>
            <p className="mt-2 text-sm text-slate-400">
              These jobs have quotes approved by the customer. Select a job, run an AI tool below, and post your findings.
            </p>
          </div>

          {approvedJobs.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-white/20 p-8 text-center text-slate-400">
              No approved jobs currently pending AI check.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 mb-8">
              {approvedJobs.map(job => (
                <div 
                  key={job.job_id} 
                  onClick={() => setSelectedJob(job)}
                  className={`cursor-pointer rounded-[1.5rem] border p-5 transition-all ${
                    selectedJob?.job_id === job.job_id 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">#{job.job_id}</span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      Approved
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white line-clamp-1">{job.title}</h4>
                  <p className="mt-2 text-xs text-slate-400">🚗 {job.make} {job.model} ({job.registration_number})</p>
                  <p className="mt-1 text-xs text-slate-400">👤 {job.customer_name}</p>
                </div>
              ))}
            </div>
          )}

          {selectedJob && (
            <div className="rounded-[1.5rem] border border-cyan-500/30 bg-cyan-500/5 p-6 mt-6">
              <h4 className="text-lg font-black text-cyan-300 mb-4">Post AI Assessment for #{selectedJob.job_id}</h4>
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                    Update Status To
                  </label>
                  <select 
                    value={updateStatus} 
                    onChange={e => setUpdateStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="diagnosed">Diagnosed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                    Assessment Notes / Findings
                  </label>
                  <textarea 
                    value={updateNotes}
                    onChange={e => setUpdateNotes(e.target.value)}
                    placeholder="Paste AI results here or write your findings..."
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  ></textarea>
                </div>
                <button 
                  onClick={handleUpdateJob}
                  disabled={!updateNotes.trim()}
                  className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-black text-white transition hover:bg-cyan-500 disabled:opacity-50"
                >
                  Submit Update to Timeline
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {models.map((m) => (
            <Link
              key={m.to}
              to={m.to + (selectedJob ? `?job_id=${selectedJob.job_id}` : '')}
              className="group rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-slate-900/80"
            >
              <div className={`mb-8 h-2 w-full rounded-full border border-white/5 bg-gradient-to-r ${m.accent}`}></div>
              <h3 className="text-2xl font-black tracking-tight text-white">{m.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-300/75">{m.desc}</p>
              <div className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300">
                Open Tool
                <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
