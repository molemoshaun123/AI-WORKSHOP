import { useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'
import JobContextPanel from './JobContextPanel'


export default function JobCardSummarizer() {
  const [form, setForm] = useState({
    title: '',
    symptoms: '',
    customer_notes: '',
    priority: 'normal',
    make: '',
    model: '',
    year: '',
    mileage: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const run = async () => {
    if (!form.title.trim() && !form.symptoms.trim() && !form.customer_notes.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/ai/job-card-summary', {
        title: form.title,
        symptoms: form.symptoms,
        customer_notes: form.customer_notes,
        priority: form.priority,
        vehicleDetails: {
          make: form.make,
          model: form.model,
          year: form.year,
          mileage: form.mileage,
        },
      })
      let data = res.data?.result
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Job card summary failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Job Card Summarizer">
      <JobContextPanel />
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 h-2 w-full rounded-full border border-white/5 bg-gradient-to-r from-fuchsia-500/20 to-rose-600/20"></div>
          <h3 className="text-2xl font-black tracking-tight text-white">Raw Job Details</h3>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-400">
            Turn rough notes into a cleaner technician-ready job card.
          </p>

          <div className="mt-6 space-y-4">
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Job title" className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-fuchsia-500" />
            <div className="grid grid-cols-2 gap-4">
              <input value={form.make} onChange={(e) => setForm((p) => ({ ...p, make: e.target.value }))} placeholder="Make" className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-fuchsia-500" />
              <input value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} placeholder="Model" className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-fuchsia-500" />
              <input value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} placeholder="Year" className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-fuchsia-500" />
              <input value={form.mileage} onChange={(e) => setForm((p) => ({ ...p, mileage: e.target.value }))} placeholder="Mileage" className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-fuchsia-500" />
            </div>

            <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-fuchsia-500">
              {['low', 'normal', 'high', 'urgent'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <textarea value={form.symptoms} onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))} placeholder="Symptoms / requested work" className="h-32 w-full resize-none rounded-[2rem] border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-fuchsia-500" />
            <textarea value={form.customer_notes} onChange={(e) => setForm((p) => ({ ...p, customer_notes: e.target.value }))} placeholder="Additional customer notes" className="h-28 w-full resize-none rounded-[2rem] border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-fuchsia-500" />
          </div>

          <button
            type="button"
            onClick={run}
            disabled={loading || (!form.title.trim() && !form.symptoms.trim() && !form.customer_notes.trim())}
            className="mt-6 w-full rounded-2xl bg-fuchsia-500 py-4 font-black text-white transition hover:bg-fuchsia-400 disabled:opacity-60"
          >
            {loading ? 'Summarizing...' : 'Summarize Job Card'}
          </button>
        </div>

        <div className="lg:col-span-7 rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <h3 className="text-xl font-black text-white">Summary Output</h3>
          {!result ? (
            <div className="flex h-72 items-center justify-center text-slate-500 font-bold">
              Enter the raw job details to generate a summary.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Brief Summary</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-white">{result.brief_summary || '-'}</p>
                <p className="mt-3 text-sm font-bold text-slate-400">
                  Priority: {result.priority || '-'} | Issue Area: {result.likely_issue_area || '-'}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inspection Checklist</p>
                  <div className="mt-4 space-y-2">
                    {(result.inspection_checklist || []).map((item, idx) => (
                      <p key={idx} className="text-sm font-semibold text-slate-300">{`- ${item}`}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parts To Prepare</p>
                  <div className="mt-4 space-y-2">
                    {(result.parts_to_prepare || []).map((item, idx) => (
                      <p key={idx} className="text-sm font-semibold text-slate-300">{`- ${item}`}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer Concerns</p>
                <div className="mt-4 space-y-2">
                  {(result.customer_concerns || []).map((item, idx) => (
                    <p key={idx} className="text-sm font-semibold text-slate-300">{`- ${item}`}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-300">Customer-Facing Summary</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-100">{result.customer_facing_summary || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
