import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'
import JobContextPanel from './JobContextPanel'


export default function SmartScheduling() {
  const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
  const [jobs, setJobs] = useState([])
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [jobsRes, scheduleRes] = await Promise.all([api.get('/jobs'), api.post('/ai/smart-schedule', {})])
      setJobs(jobsRes.data)
      let data = scheduleRes.data?.result
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setSchedule(data)
    } catch (e) {
      setSchedule(null)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const jobsById = useMemo(() => new Map((jobs || []).map((j) => [j.job_id, j])), [jobs])

  const apply = async () => {
    if (!schedule?.recommended_order?.length) return
    setApplying(true)
    try {
      const payload = schedule.recommended_order.map((x, idx) => ({
        job_id: x.job_id,
        scheduled_rank: idx + 1,
        predicted_completion: x.suggested_end_iso,
        applied_by: admin?.user_id || null,
      }))
      await api.put('/jobs/schedule/apply', { schedule: payload })
      toast.success('Schedule applied')
      load()
    } catch (e) {
      toast.error('Failed to apply schedule')
    } finally {
      setApplying(false)
    }
  }

  return (
    <AppLayout title="Smart Job Scheduling">
      <JobContextPanel />
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Recommended Schedule</h3>
            <p className="text-slate-400 text-sm font-semibold">Based on bookings, priorities, and estimated durations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 font-black hover:bg-white/10 transition-all disabled:opacity-60"
            >
              Refresh
            </button>
            <button
              onClick={apply}
              disabled={applying || loading || !schedule?.recommended_order?.length}
              className="px-5 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black hover:bg-cyan-300 transition-all disabled:opacity-60"
            >
              {applying ? 'Applying...' : 'Apply Rank'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-slate-400 font-bold">Loading...</div>
        ) : !schedule?.recommended_order?.length ? (
          <div className="p-10 text-slate-500 font-bold">No schedule available.</div>
        ) : (
          <div className="p-8 space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Predicted completion</div>
              <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                {schedule.predicted_completion_iso ? new Date(schedule.predicted_completion_iso).toLocaleString() : '—'}
              </div>
            </div>

            {schedule.recommended_order.map((item, idx) => {
              const job = jobsById.get(item.job_id)
              return (
                <div key={`${item.job_id}-${idx}`} className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                  <div className="flex justify-between gap-6">
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-black">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <p className="text-white font-black truncate">{job?.title || `Job #${item.job_id}`}</p>
                        {job?.priority && (
                          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {job.priority}
                          </span>
                        )}
                        {job?.appointment_date && (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                            Booking {new Date(job.appointment_date).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm font-semibold truncate">{item.reason}</p>
                      <p className="text-slate-500 text-xs font-bold mt-3">
                        Start: {item.suggested_start_iso ? new Date(item.suggested_start_iso).toLocaleString() : '—'} • End:{' '}
                        {item.suggested_end_iso ? new Date(item.suggested_end_iso).toLocaleString() : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                        {job?.status || 'pending'}
                      </div>
                      {(job?.estimated_hours || job?.estimated_days) && (
                        <p className="text-slate-400 text-xs font-bold mt-2">
                          {job?.estimated_hours ? `${Number(job.estimated_hours).toFixed(1)}h` : ''}{' '}
                          {job?.estimated_days ? `${Number(job.estimated_days).toFixed(1)}d` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

