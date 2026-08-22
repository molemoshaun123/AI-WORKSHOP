import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../../services/api'
import toast from 'react-hot-toast'

export default function JobContextPanel({ onUpdateComplete }) {
  const [searchParams] = useSearchParams()
  const job_id = searchParams.get('job_id')

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)

  const [updateNotes, setUpdateNotes] = useState('')
  const [updateStatus, setUpdateStatus] = useState('diagnosed')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!job_id) return

    const loadJob = async () => {
      setLoading(true)
      try {
        // We can fetch from the approved-for-ai list and filter
        const res = await api.get('/jobs/approved-for-ai')
        const foundJob = res.data.find(j => String(j.job_id) === String(job_id))
        
        if (foundJob) {
          setJob(foundJob)
        } else {
          toast.error('Job not found or not approved for AI.')
        }
      } catch (err) {
        toast.error('Failed to load job details')
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [job_id])

  const handleUpdateJob = async () => {
    if (!job) return
    setSubmitting(true)
    try {
      const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
      await api.put(`/jobs/${job.job_id}`, {
        status: updateStatus,
        notes: updateNotes,
        changed_by: admin?.user_id || null
      })
      toast.success('Job timeline updated!')
      setUpdateNotes('')
      if (onUpdateComplete) onUpdateComplete()
    } catch (e) {
      toast.error('Failed to update job')
    } finally {
      setSubmitting(false)
    }
  }

  if (!job_id) return null

  if (loading) {
    return (
      <div className="mb-8 rounded-[1.5rem] border border-cyan-500/30 bg-cyan-500/5 p-6 text-center text-cyan-300">
        Loading job context...
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="mb-8 rounded-[2rem] border border-cyan-500/30 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="mb-2 inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
            Active Job Context: #{job.job_id}
          </span>
          <h2 className="text-2xl font-black text-white">{job.title}</h2>
          <p className="mt-2 text-sm text-slate-400">🚗 {job.make} {job.model} ({job.registration_number})</p>
          <p className="mt-1 text-sm text-slate-400">👤 {job.customer_name}</p>
        </div>
        <div className="text-right max-w-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Symptoms / Notes</p>
          <p className="mt-1 text-sm italic text-slate-300 line-clamp-3">"{job.symptoms}"</p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
        <h4 className="text-sm font-black text-cyan-300 mb-4">Post AI Findings to Timeline</h4>
        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
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
          <div className="md:col-span-7">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Findings / Notes
            </label>
            <textarea 
              value={updateNotes}
              onChange={e => setUpdateNotes(e.target.value)}
              placeholder="Paste AI results here or write your findings..."
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
            ></textarea>
          </div>
          <div className="md:col-span-2 flex items-end">
            <button 
              onClick={handleUpdateJob}
              disabled={!updateNotes.trim() || submitting}
              className="w-full rounded-xl bg-cyan-600 p-3 text-sm font-black text-white transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
