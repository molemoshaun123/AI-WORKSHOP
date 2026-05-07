import AppLayout from '../../../layouts/AppLayout'
import ImageModelBase from './ImageModelBase'

export default function ColourIdentification() {
  return (
    <AppLayout title="Car Colour Identification">
      <ImageModelBase
        title="Car Colour Identification"
        subtitle="Identify paint colour and get mixing guidance for closer matching."
        type="color"
        accent="from-pink-500/20 to-purple-600/20"
        renderResult={(r) => (
          <div className="space-y-5">
            <div className={`p-4 rounded-[1.5rem] border ${
              r.provider === 'fallback'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${
                r.provider === 'fallback' ? 'text-amber-300' : 'text-emerald-300'
              }`}>
                Analysis Source
              </p>
              <p className="mt-2 text-sm font-black text-white">
                {r.provider === 'fallback' ? 'Fallback response' : 'colour model response'}
              </p>
              {r.fallback_reason && (
                <p className="mt-2 text-sm font-semibold text-slate-300">{r.fallback_reason}</p>
              )}
            </div>

            <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Colour Name</p>
              <p className="text-2xl font-black text-white">{r.color_name}</p>
              {r.confidence_score != null && <p className="text-slate-400 font-semibold text-sm mt-2">Confidence: {r.confidence_score}</p>}
            </div>

            <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Mix Suggestion</p>
              {Array.isArray(r.mix_suggestion) && r.mix_suggestion.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {r.mix_suggestion.map((m, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-white font-black text-sm">{m.component}</p>
                      <p className="text-slate-300/70 font-bold text-xs mt-1">{m.ratio_percent}%</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 font-semibold text-sm">No mix suggestion provided.</p>
              )}
            </div>

            {r.notes && (
              <div className="p-6 rounded-[2rem] bg-purple-500/10 border border-purple-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 mb-2">Notes</p>
                <p className="text-slate-200 font-semibold text-sm leading-relaxed">{r.notes}</p>
                {r.debug_error && (
                  <p className="mt-3 text-[11px] font-semibold text-slate-400">
                    Server detail: {String(r.debug_error)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      />
    </AppLayout>
  )
}
