import { useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'

export default function FaultDiagnosis() {
  const [symptoms, setSymptoms] = useState('')
  const [vehicle, setVehicle] = useState({ make: '', model: '', year: '', mileage: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleRun = async () => {
    if (!symptoms.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/ai/diagnose', {
        symptoms,
        vehicleDetails: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          mileage: vehicle.mileage,
        },
      })

      let data = res.data?.diagnosis
      if (typeof data === 'string') {
        data = JSON.parse(data.replace(/```json|```/g, '').trim())
      }
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Diagnosis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Fault Diagnosis">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
          <h3 className="text-xl font-black mb-6">Input</h3>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <input
              value={vehicle.make}
              onChange={(e) => setVehicle((p) => ({ ...p, make: e.target.value }))}
              placeholder="Make"
              className="bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              value={vehicle.model}
              onChange={(e) => setVehicle((p) => ({ ...p, model: e.target.value }))}
              placeholder="Model"
              className="bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              value={vehicle.year}
              onChange={(e) => setVehicle((p) => ({ ...p, year: e.target.value }))}
              placeholder="Year"
              className="bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              value={vehicle.mileage}
              onChange={(e) => setVehicle((p) => ({ ...p, mileage: e.target.value }))}
              placeholder="Mileage"
              className="bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Enter symptoms in detail..."
            className="w-full bg-slate-950/40 border border-white/10 rounded-[2rem] px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 h-44 resize-none"
          />

          <button
            onClick={handleRun}
            disabled={loading || !symptoms.trim()}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.01] transition-all disabled:opacity-60"
          >
            {loading ? 'Analyzing...' : 'Run Diagnosis'}
          </button>
        </div>

        <div className="lg:col-span-7 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black">Probability-Based Plan</h3>
            {result?.confidence_score != null && (
              <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                Confidence: {result.confidence_score}
              </div>
            )}
          </div>

          {!result ? (
            <div className="h-72 flex items-center justify-center text-slate-500 font-bold">
              Enter symptoms to generate a diagnostic plan.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Predicted Problem</p>
                <p className="text-white font-black text-lg">{result.predicted_problem}</p>
                <p className="text-slate-400 font-semibold text-sm mt-2">Urgency: {result.urgency}</p>
              </div>

              <div className="grid gap-4">
                {(result.probable_causes || result.possible_causes || []).map((c, idx) => (
                  <div key={idx} className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                    <div className="flex justify-between items-start gap-6">
                      <div>
                        <p className="text-white font-black">{c.cause || c}</p>
                        {c.check_first && <p className="text-slate-300/80 font-semibold text-sm mt-2">Check first: {c.check_first}</p>}
                        {c.if_still_present_next && (
                          <p className="text-slate-300/70 font-semibold text-sm mt-2">If still present: {c.if_still_present_next}</p>
                        )}
                        {c.if_fixed_then_verify && (
                          <p className="text-slate-300/60 font-semibold text-sm mt-2">Then verify: {c.if_fixed_then_verify}</p>
                        )}
                      </div>
                      {c.probability_percent != null && (
                        <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest">
                          {c.probability_percent}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result.recommended_action && (
                <div className="p-6 rounded-[2rem] bg-blue-500/10 border border-blue-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Recommended Action</p>
                  <p className="text-slate-200 font-semibold text-sm leading-relaxed">{String(result.recommended_action)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

