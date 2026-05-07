import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [diagnoses, setDiagnoses] = useState({})
  const [staff, setStaff] = useState([])
  const [updateDraft, setUpdateDraft] = useState({ open: false, job: null, status: 'in_progress', result: null, loading: false })

  const loadJobs = async () => {
    try {
      const res = await api.get('/jobs')
      setJobs(res.data)
    } catch (err) {
      toast.error('Failed to load jobs')
    }
  }

  const loadStaff = async () => {
    try {
      const res = await api.get('/admin/staff')
      setStaff(res.data)
    } catch (e) {
      setStaff([])
    }
  }

  const updateStatus = async (jobId, status) => {
    try {
      const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
      await api.put(`/jobs/${jobId}`, { status, changed_by: admin?.user_id || null })
      loadJobs()
    } catch (err) {
      toast.error('Failed to update job status')
    }
  }

  const assignMechanic = async (jobId, mechanic_id) => {
    try {
      const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
      await api.put(`/jobs/${jobId}/assign`, { mechanic_id: mechanic_id || null, assigned_by: admin?.user_id || null })
      loadJobs()
    } catch (err) {
      toast.error('Failed to assign mechanic')
    }
  }

  const runAiDiagnosis = async (jobId, symptoms) => {
    try {
      const res = await api.post('/jobs/ai-diagnosis', { symptoms })
      setDiagnoses({ ...diagnoses, [jobId]: res.data.diagnosis })
    } catch (err) {
      toast.error('Diagnosis failed')
    }
  }

  const openUpdate = (job, status) => {
    setUpdateDraft({ open: true, job, status: status || 'in_progress', result: null, loading: false })
  }

  const generateUpdate = async () => {
    if (!updateDraft.job) return
    setUpdateDraft((p) => ({ ...p, loading: true, result: null }))
    try {
      const res = await api.post('/ai/customer-update', { job_id: updateDraft.job.job_id, new_status: updateDraft.status })
      let data = res.data?.result
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setUpdateDraft((p) => ({ ...p, result: data, loading: false }))
    } catch (e) {
      setUpdateDraft((p) => ({ ...p, loading: false }))
      toast.error('Failed to generate update')
    }
  }

  const copyUpdate = async () => {
    const r = updateDraft.result
    if (!r?.message) return
    try {
      await navigator.clipboard.writeText(`${r.message}\n\nETA: ${r.eta_text || ''}\nNext: ${(r.next_steps || []).join(', ')}`)
      toast.error('Copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  useEffect(() => {
    loadJobs()
    loadStaff()
  }, [])

  return (
    <AppLayout title="Job Management">
      <div className="space-y-6">
        {jobs.map((job) => (
          <div key={job.job_id} className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
            
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-2xl font-black tracking-tight">{job.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    job.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {job.priority}
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {job.status}
                  </span>
                </div>
                
                <p className="text-slate-400 text-sm leading-relaxed mb-6 bg-slate-950/30 p-4 rounded-2xl border border-white/5 italic">
                  "{job.symptoms}"
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-5 rounded-[2rem] bg-slate-950/30 border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Customer</p>
                    <p className="text-white font-black">{job.customer_name || '—'}</p>
                    <p className="text-slate-400 text-xs font-bold mt-1">{job.customer_email || ''}</p>
                    <p className="text-slate-500 text-xs font-bold mt-2">
                      {job.make ? `${job.make} ${job.model} (${job.registration_number})` : ''}
                    </p>
                  </div>
                  <div className="p-5 rounded-[2rem] bg-slate-950/30 border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Assigned Mechanic</p>
                    <p className="text-white font-black">{job.mechanic_name || 'Not assigned'}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <select
                        value={job.mechanic_id || ''}
                        onChange={(e) => assignMechanic(job.job_id, e.target.value ? Number(e.target.value) : null)}
                        className="col-span-2 bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Unassigned</option>
                        {staff.map((s) => (
                          <option key={s.user_id} value={s.user_id}>
                            {s.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🆔</span> Job #{job.job_id}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span> {new Date(job.created_at).toLocaleDateString()}
                  </div>
                  {job.appointment_date && (
                    <div className="flex items-center gap-2 text-emerald-300">
                      <span className="text-lg">🗓️</span> Booking {new Date(job.appointment_date).toLocaleString()}
                    </div>
                  )}
                  {(job.estimated_hours || job.estimated_days) && (
                    <div className="flex items-center gap-2 text-cyan-300">
                      <span className="text-lg">⏱️</span>{' '}
                      {job.estimated_hours ? `${Number(job.estimated_hours).toFixed(1)}h` : ''}{' '}
                      {job.estimated_days ? `${Number(job.estimated_days).toFixed(1)}d` : ''}
                    </div>
                  )}
                  {job.predicted_completion && (
                    <div className="flex items-center gap-2 text-indigo-300">
                      <span className="text-lg">📍</span> ETA {new Date(job.predicted_completion).toLocaleString()}
                    </div>
                  )}
                  <Link to="/inbox" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                    <span className="text-lg">💬</span> Message Customer
                  </Link>
                </div>
              </div>

              <div className="lg:w-80 space-y-4">
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Actions</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => runAiDiagnosis(job.job_id, job.symptoms)} 
                      className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-purple-500/20"
                    >
                      🛠️ Diagnose
                    </button>
                    <button 
                      onClick={() => updateStatus(job.job_id, 'in_progress')} 
                      className="bg-slate-800 text-white p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5"
                    >
                      ⚙️ Repairing
                    </button>
                    <button 
                      onClick={() => updateStatus(job.job_id, 'completed')} 
                      className="col-span-2 bg-emerald-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      🏁 Mark Complete
                    </button>
                    <button
                      onClick={() => openUpdate(job, job.status)}
                      className="col-span-2 bg-amber-500/10 text-amber-300 border border-amber-500/20 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                    >
                      ✉️ Generate Customer Update
                    </button>
                    <Link
                      to="/admin/ai/smart-scheduling"
                      className="col-span-2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all text-center"
                    >
                      🧭 Smart Scheduling
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {diagnoses[job.job_id] && (
              <div className="mt-8 animate-in zoom-in-95 duration-500">
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-600/10 rounded-[2rem] p-8 border border-purple-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20 text-4xl font-black">Report</div>
                  <h4 className="text-purple-400 font-black text-xs uppercase tracking-[0.3em] mb-4">Automated Diagnostic Report</h4>
                  <div className="text-sm text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                    {typeof diagnoses[job.job_id] === 'string'
                      ? diagnoses[job.job_id]
                      : JSON.stringify(diagnoses[job.job_id], null, 2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {updateDraft.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
          <div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Customer Update</p>
                <h3 className="text-2xl font-black tracking-tight">Job #{updateDraft.job?.job_id}</h3>
              </div>
              <button
                onClick={() => setUpdateDraft({ open: false, job: null, status: 'in_progress', result: null, loading: false })}
                className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 font-black hover:bg-white/10 transition-all"
              >
                Close
              </button>
            </div>
            <div className="p-8 grid md:grid-cols-3 gap-4">
              <select
                value={updateDraft.status}
                onChange={(e) => setUpdateDraft((p) => ({ ...p, status: e.target.value }))}
                className="md:col-span-1 bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
              >
                {['pending', 'diagnosed', 'in_progress', 'completed'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={generateUpdate}
                disabled={updateDraft.loading}
                className="md:col-span-1 bg-amber-500 text-slate-950 font-black py-4 rounded-2xl hover:bg-amber-400 transition-all disabled:opacity-60"
              >
                {updateDraft.loading ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={copyUpdate}
                disabled={!updateDraft.result?.message}
                className="md:col-span-1 bg-white/5 border border-white/10 font-black py-4 rounded-2xl hover:bg-white/10 transition-all disabled:opacity-60"
              >
                Copy
              </button>
            </div>
            <div className="px-8 pb-8">
              {!updateDraft.result ? (
                <div className="p-8 rounded-[2rem] bg-slate-950/30 border border-white/5 text-slate-500 font-bold text-center">
                  Generate a message to show the customer update.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Message</p>
                    <p className="text-slate-200 font-semibold leading-relaxed">{updateDraft.result.message}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">ETA</p>
                      <p className="text-white font-black">{updateDraft.result.eta_text || '—'}</p>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Next Steps</p>
                      <div className="space-y-2">
                        {(updateDraft.result.next_steps || []).slice(0, 6).map((t, idx) => (
                          <p key={idx} className="text-slate-300/80 font-semibold text-sm">
                            • {t}
                          </p>
                        ))}
                        {(updateDraft.result.next_steps || []).length === 0 && (
                          <p className="text-slate-500 font-bold">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
