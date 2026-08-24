import { useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'
import JobContextPanel from './JobContextPanel'


function formatZAR(val) {
  if (val == null || val === '-' || isNaN(val)) return String(val ?? '-')
  return 'R ' + Number(val).toLocaleString('en-ZA')
}

export default function RepairCostEstimator() {
  const [symptoms, setSymptoms] = useState('')
  const [vehicle, setVehicle] = useState({ make: '', model: '', year: '', mileage: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const run = async () => {
    if (!symptoms.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/ai/repair-cost-estimate', {
        symptoms,
        vehicleDetails: vehicle,
      })
      let data = res.data?.result
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cost estimate failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Repair Cost Estimator">
      <JobContextPanel />
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 h-2 w-full rounded-full bg-gradient-to-r from-emerald-500/20 to-lime-600/20 border border-white/5"></div>
          <h3 className="text-2xl font-black tracking-tight text-white">Estimate Inputs</h3>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-400">
            Use symptoms and vehicle details to estimate a repair cost range before inspection.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <input value={vehicle.make} onChange={(e) => setVehicle((p) => ({ ...p, make: e.target.value }))} placeholder="Make" className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
            <input value={vehicle.model} onChange={(e) => setVehicle((p) => ({ ...p, model: e.target.value }))} placeholder="Model" className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
            <input value={vehicle.year} onChange={(e) => setVehicle((p) => ({ ...p, year: e.target.value }))} placeholder="Year" className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
            <input value={vehicle.mileage} onChange={(e) => setVehicle((p) => ({ ...p, mileage: e.target.value }))} placeholder="Mileage" className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe the problem, the requested repair, warning lights, noises, leaks, or safety concerns..."
            className="mt-5 h-44 w-full resize-none rounded-[2rem] border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="button"
            onClick={run}
            disabled={loading || !symptoms.trim()}
            className="mt-6 w-full rounded-2xl bg-emerald-500 py-4 font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? 'Estimating...' : 'Estimate Cost'}
          </button>
        </div>

        <div className="lg:col-span-7 rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <h3 className="text-xl font-black text-white">Estimate</h3>
          {!result ? (
            <div className="flex h-72 items-center justify-center text-slate-500 font-bold">
              Enter the job details to see a repair cost range.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Likely Service</p>
                  <p className="mt-2 text-lg font-black text-white">{result.likely_service || '-'}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {result.service_category && (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        result.service_category === 'Minor Service' ? 'bg-blue-500/10 text-blue-400' :
                        result.service_category === 'Major Service' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {result.service_category}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-slate-400">Urgency: {result.urgency || '-'}</p>
                  </div>
                </div>
                <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Estimated Total (ZAR)</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {formatZAR(result.estimated_total_cost_min)} – {formatZAR(result.estimated_total_cost_max)}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Labor</p>
                  <p className="mt-2 text-lg font-black text-white">{result.estimated_labor_hours_min ?? '-'}h - {result.estimated_labor_hours_max ?? '-'}h</p>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parts (ZAR)</p>
                  <p className="mt-2 text-lg font-black text-white">{formatZAR(result.estimated_parts_cost_min)} – {formatZAR(result.estimated_parts_cost_max)}</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cost Drivers</p>
                <div className="mt-4 space-y-2">
                  {(result.cost_drivers || []).map((item, idx) => (
                    <p key={idx} className="text-sm font-semibold text-slate-300">{`- ${item}`}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assumptions</p>
                <div className="mt-4 space-y-2">
                  {(result.assumptions || []).map((item, idx) => (
                    <p key={idx} className="text-sm font-semibold text-slate-300">{`- ${item}`}</p>
                  ))}
                </div>
              </div>

              {result.recommended_next_step && (
                <div className="rounded-[2rem] border border-lime-500/20 bg-lime-500/10 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-lime-300">Recommended Next Step</p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-100">{result.recommended_next_step}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
