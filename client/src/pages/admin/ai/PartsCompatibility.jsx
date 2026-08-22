import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'
import JobContextPanel from './JobContextPanel'


export default function PartsCompatibility() {
  const [vehicle, setVehicle] = useState({ make: '', model: '', year: '', vin: '' })
  const [partName, setPartName] = useState('')
  const [inventory, setInventory] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/inventory/parts')
        setInventory(res.data)
      } catch (e) {
        setInventory([])
      }
    }
    load()
  }, [])

  const run = async () => {
    if (!partName.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/ai/parts-compatibility', {
        part_name: partName,
        vehicle,
      })
      let data = res.data?.result
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Compatibility check failed')
    } finally {
      setLoading(false)
    }
  }

  const badge = (text, tone) => {
    const map = {
      green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      red: 'bg-red-500/10 text-red-300 border-red-500/20',
      blue: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    }
    return (
      <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${map[tone] || map.blue}`}>
        {text}
      </span>
    )
  }

  return (
    <AppLayout title="Parts Compatibility + Alternatives">
      <JobContextPanel />
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-white/5 mb-6"></div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Fitment Check</h3>
          <p className="text-slate-300/70 font-semibold mb-8">Confirm fitment likelihood and suggest in-stock alternatives.</p>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <input
              value={vehicle.make}
              onChange={(e) => setVehicle((p) => ({ ...p, make: e.target.value }))}
              placeholder="Make"
              className="bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              value={vehicle.model}
              onChange={(e) => setVehicle((p) => ({ ...p, model: e.target.value }))}
              placeholder="Model"
              className="bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              value={vehicle.year}
              onChange={(e) => setVehicle((p) => ({ ...p, year: e.target.value }))}
              placeholder="Year"
              className="bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              value={vehicle.vin}
              onChange={(e) => setVehicle((p) => ({ ...p, vin: e.target.value }))}
              placeholder="VIN (optional)"
              className="bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <input
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
            placeholder="Part name (e.g. brake pads, oil filter, alternator)"
            className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <button
            onClick={run}
            disabled={loading || !partName.trim()}
            className="w-full mt-6 bg-cyan-400 text-slate-950 font-black py-4 rounded-2xl hover:bg-cyan-300 transition-all disabled:opacity-60"
          >
            {loading ? 'Checking...' : 'Check Compatibility'}
          </button>

          <div className="mt-8 p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Inventory Snapshot</p>
            <p className="text-slate-300/70 font-semibold text-sm">Parts in stock: {(inventory || []).filter((p) => Number(p.quantity || 0) > 0).length}</p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black">Result</h3>
            {result?.confidence_score != null && badge(`Confidence ${result.confidence_score}`, 'blue')}
          </div>

          {!result ? (
            <div className="h-64 flex items-center justify-center text-slate-500 font-bold">Enter a part name to see results.</div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                <div className="flex justify-between items-start gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Fitment</p>
                    <p className="text-2xl font-black">{String(result.fitment || '').toUpperCase()}</p>
                  </div>
                  {result.fitment === 'confirmed' && badge('Confirmed', 'green')}
                  {result.fitment === 'likely' && badge('Likely', 'amber')}
                  {result.fitment === 'uncertain' && badge('Uncertain', 'amber')}
                  {result.fitment === 'not_compatible' && badge('Not Compatible', 'red')}
                </div>
                <div className="mt-4 space-y-2">
                  {(result.reasons || []).slice(0, 6).map((r, idx) => (
                    <p key={idx} className="text-slate-300/70 text-sm font-semibold">
                      • {r}
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">In-Stock Matches</p>
                  {(result.in_stock_matches || []).length === 0 ? (
                    <p className="text-slate-500 font-bold text-sm">No direct in-stock matches.</p>
                  ) : (
                    <div className="space-y-3">
                      {result.in_stock_matches.map((p, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <p className="font-black text-white">{p.name}</p>
                          <p className="text-slate-400 text-xs font-bold mt-1">
                            SKU: {p.sku || '-'} • Stock: {p.quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Alternatives</p>
                  {(result.alternatives || []).length === 0 ? (
                    <p className="text-slate-500 font-bold text-sm">No alternatives suggested.</p>
                  ) : (
                    <div className="space-y-3">
                      {result.alternatives.map((p, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <p className="font-black text-white">{p.name}</p>
                          <p className="text-slate-400 text-xs font-bold mt-1">
                            SKU: {p.sku || '-'} • Stock: {p.quantity}
                          </p>
                          {p.reason && <p className="text-slate-300/70 text-xs font-semibold mt-2">{p.reason}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Reorder Suggestions</p>
                {(result.reorder_suggestions || []).length === 0 ? (
                  <p className="text-slate-500 font-bold text-sm">No reorder suggestions.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {result.reorder_suggestions.map((p, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <p className="font-black text-white">{p.name}</p>
                        <p className="text-amber-200 text-xs font-bold mt-1">
                          SKU: {p.sku || '-'} • Suggested Qty: {p.suggested_qty}
                        </p>
                        {p.reason && <p className="text-slate-200/80 text-xs font-semibold mt-2">{p.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

