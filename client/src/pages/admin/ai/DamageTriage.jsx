import AppLayout from '../../../layouts/AppLayout'
import ImageModelBase from './ImageModelBase'
import JobContextPanel from './JobContextPanel'


export default function DamageTriage() {
  return (
    <AppLayout title="Parts Inspection">
      <JobContextPanel />
      <ImageModelBase
        title="Parts Inspection (Photo)"
        subtitle="Upload a part photo and decide if it is fixable or must be replaced."
        type="damage"
        accent="from-orange-500/20 to-red-600/20"
        renderResult={(r) => (
          <div className="space-y-5">
            <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Decision</p>
              <div className="flex items-center justify-between gap-6">
                <div>
                  {(() => {
                    const d = String(r.decision || '').toLowerCase()
                    const isRepair = d === 'repair' || d === 'fix' || d === 'fixable'
                    return (
                      <>
                        <p className="text-white font-black text-xl">{isRepair ? 'FIXABLE' : 'REPLACE'}</p>
                        <p className="text-slate-400 font-semibold text-sm mt-2">Part: {r.part}</p>
                      </>
                    )
                  })()}
                </div>
                {r.confidence_score != null && (
                  <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Confidence: {r.confidence_score}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Reason</p>
              <p className="text-slate-200 font-semibold text-sm leading-relaxed">{r.reason || '-'}</p>
            </div>
          </div>
        )}
      />
    </AppLayout>
  )
}

