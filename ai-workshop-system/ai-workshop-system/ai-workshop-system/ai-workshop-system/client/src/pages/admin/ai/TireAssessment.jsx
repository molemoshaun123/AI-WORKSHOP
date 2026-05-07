import AppLayout from '../../../layouts/AppLayout'
import ImageModelBase from './ImageModelBase'

export default function TireAssessment() {
  return (
    <AppLayout title="Tire Condition">
      <ImageModelBase
        title="Tire Condition"
        subtitle="Upload a tire photo and determine if it is serviceable or needs replacement."
        type="tire"
        accent="from-emerald-500/20 to-teal-600/20"
        renderResult={(r) => (
          <div className="space-y-5">
            {/* Condition Badge */}
            <div className={`p-6 rounded-[2rem] border ${
              r.condition === 'replace'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Condition</p>
              <div className="flex items-center justify-between gap-6">
                <p className={`font-black text-xl ${r.condition === 'replace' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {r.condition === 'replace' ? '⚠️ REPLACE' : '✅ FINE'}
                </p>
                {r.confidence_score != null && (
                  <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Confidence: {Math.round((r.confidence_score || 0) * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Urgency */}
            {r.urgency && r.urgency !== 'none' && (
              <div className={`p-4 rounded-[1.5rem] border text-center ${
                r.urgency === 'immediate'
                  ? 'bg-red-600/15 border-red-500/25 text-red-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {r.urgency === 'immediate' ? '🚨 IMMEDIATE REPLACEMENT NEEDED' : '⏳ REPLACE SOON'}
                </p>
              </div>
            )}

            {/* Lifespan Estimates */}
            {(r.estimated_remaining_life_years != null || r.estimated_remaining_km != null) && (
              <div className="grid grid-cols-2 gap-4">
                {r.estimated_remaining_life_years != null && (
                  <div className="p-5 rounded-[2rem] bg-slate-950/30 border border-white/5 text-center">
                    <p className="text-3xl font-black text-cyan-300">{r.estimated_remaining_life_years}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Years Remaining</p>
                  </div>
                )}
                {r.estimated_remaining_km != null && (
                  <div className="p-5 rounded-[2rem] bg-slate-950/30 border border-white/5 text-center">
                    <p className="text-3xl font-black text-cyan-300">{Number(r.estimated_remaining_km).toLocaleString()}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">KM Remaining</p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            {r.recommendation && (
              <div className="p-6 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-2">Recommendation</p>
                <p className="text-slate-200 font-semibold text-sm leading-relaxed">{r.recommendation}</p>
              </div>
            )}

            {/* Reason / Evidence */}
            <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Evidence</p>
              <p className="text-slate-200 font-semibold text-sm leading-relaxed">{r.reason || '-'}</p>
            </div>

            {/* Replacement timeframe (legacy field) */}
            {r.condition === 'replace' && r.recommended_timeframe && (
              <div className="p-4 rounded-[1.5rem] bg-slate-950/30 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Replacement Timeframe</p>
                <p className="text-slate-300 font-semibold text-sm">{r.recommended_timeframe}</p>
              </div>
            )}
          </div>
        )}
      />
    </AppLayout>
  )
}
