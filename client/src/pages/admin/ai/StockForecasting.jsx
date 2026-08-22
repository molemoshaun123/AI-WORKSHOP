import { useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'
import JobContextPanel from './JobContextPanel'


const RISK_COLORS = {
  critical: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500', label: 'Critical' },
  warning: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500', label: 'Warning' },
  healthy: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'Healthy' },
}

export default function StockForecasting() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [filter, setFilter] = useState('all')

  const run = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/ai/stock-forecast', { now: new Date().toISOString() })
      let data = res.data?.result
      if (typeof data === 'string') {
        let clean = data.replace(/```json|```/gi, '').trim()
        const firstBrace = clean.indexOf('{')
        const lastBrace = clean.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1) {
          clean = clean.slice(firstBrace, lastBrace + 1)
        }
        data = JSON.parse(clean)
      }
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock forecast failed')
    } finally {
      setLoading(false)
    }
  }

  const forecasts = (result?.forecasts || []).filter(f => filter === 'all' || f.risk_level === filter)
  const riskCounts = {
    critical: (result?.forecasts || []).filter(f => f.risk_level === 'critical').length,
    warning: (result?.forecasts || []).filter(f => f.risk_level === 'warning').length,
    healthy: (result?.forecasts || []).filter(f => f.risk_level === 'healthy').length,
  }

  return (
    <AppLayout title="Stock Forecasting">
      <JobContextPanel />
      <div className="space-y-8">
        {/* Hero section */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-teal-500/15 via-slate-900/80 to-blue-500/10 p-8 shadow-2xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-teal-300">
                📊 AI Inventory Intelligence
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Predict stock needs before you run out
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300/80 sm:text-base">
                AI analyzes your parts inventory, order history, and job trends to forecast demand, flag at-risk items, and recommend reorder quantities.
              </p>
            </div>

            <button
              type="button"
              onClick={run}
              disabled={loading}
              className="shrink-0 rounded-2xl bg-teal-500 px-8 py-4 font-black text-slate-950 shadow-lg shadow-teal-500/20 transition hover:bg-teal-400 hover:shadow-teal-400/30 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                  Analyzing Inventory...
                </span>
              ) : result ? 'Re-Analyze Stock' : 'Run Stock Forecast'}
            </button>
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-teal-500/20 border-t-teal-500" />
            <p className="text-sm font-bold text-slate-400 animate-pulse">Analyzing inventory patterns and job trends...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-white/10 bg-slate-900/60 py-24 shadow-2xl backdrop-blur-xl">
            <div className="text-6xl">📦</div>
            <p className="text-lg font-black text-slate-400">No forecast yet</p>
            <p className="text-sm font-semibold text-slate-500">Click "Run Stock Forecast" to analyze your inventory</p>
          </div>
        )}

        {/* Results */}
        {!loading && result && (
          <>
            {/* Summary cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Parts Tracked</p>
                <p className="mt-3 text-4xl font-black text-white">{result.total_parts_tracked ?? 0}</p>
              </div>
              <div className={`rounded-[2rem] border ${(result.parts_at_risk || 0) > 0 ? 'border-red-500/30 bg-red-500/10' : 'border-emerald-500/30 bg-emerald-500/10'} p-6 shadow-2xl`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${(result.parts_at_risk || 0) > 0 ? 'text-red-300' : 'text-emerald-300'}`}>At Risk</p>
                <p className="mt-3 text-4xl font-black text-white">{result.parts_at_risk ?? 0}</p>
              </div>
              <div className="rounded-[2rem] border border-teal-500/30 bg-teal-500/10 p-6 shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">Est. Monthly Spend</p>
                <p className="mt-3 text-4xl font-black text-white">R{result.estimated_monthly_spend?.toLocaleString?.() ?? '—'}</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Risk Breakdown</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-black text-red-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> {riskCounts.critical}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-black text-amber-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> {riskCounts.warning}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-black text-emerald-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {riskCounts.healthy}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {result.summary && (
              <div className="rounded-[2rem] border border-teal-500/20 bg-gradient-to-r from-teal-500/10 to-blue-500/10 p-6 shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">AI Summary</p>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-200">{result.summary}</p>
              </div>
            )}

            {/* Priority Actions + Insights */}
            <div className="grid gap-6 lg:grid-cols-2">
              {(result.top_priority_actions || []).length > 0 && (
                <div className="rounded-[2rem] border border-red-500/20 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">🚨 Priority Actions</p>
                  <div className="mt-4 space-y-3">
                    {result.top_priority_actions.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-slate-950/30 p-4">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-xs font-black text-red-400">{i + 1}</span>
                        <p className="text-sm font-semibold text-slate-200">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(result.insights || []).length > 0 && (
                <div className="rounded-[2rem] border border-blue-500/20 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">💡 AI Insights</p>
                  <div className="mt-4 space-y-3">
                    {result.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-slate-950/30 p-4">
                        <span className="mt-0.5 text-blue-400">→</span>
                        <p className="text-sm font-semibold text-slate-200">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Forecast Table */}
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">Part-by-Part Forecast</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-400">Predicted stock levels and reorder recommendations</p>
                </div>

                {/* Filter pills */}
                <div className="flex gap-2">
                  {['all', 'critical', 'warning', 'healthy'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                        filter === f
                          ? 'bg-teal-500 text-slate-950'
                          : 'border border-white/10 bg-slate-950/50 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {f === 'all' ? `All (${result.forecasts?.length || 0})` : `${f} (${riskCounts[f]})`}
                    </button>
                  ))}
                </div>
              </div>

              {forecasts.length === 0 ? (
                <div className="mt-8 flex items-center justify-center py-12 text-sm font-bold text-slate-500">
                  No parts match the selected filter.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {forecasts.map((f, idx) => {
                    const risk = RISK_COLORS[f.risk_level] || RISK_COLORS.healthy
                    return (
                      <div
                        key={idx}
                        className={`rounded-[2rem] border ${risk.border} ${risk.bg} p-6 transition hover:scale-[1.005]`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-center gap-4">
                            <span className={`h-3 w-3 shrink-0 rounded-full ${risk.dot} shadow-lg shadow-current/30`} />
                            <div>
                              <h4 className="text-lg font-black text-white">{f.part_name}</h4>
                              {f.sku && f.sku !== '-' && (
                                <p className="text-xs font-bold text-slate-500">SKU: {f.sku}</p>
                              )}
                            </div>
                            <span className={`rounded-xl ${risk.bg} border ${risk.border} px-3 py-1 text-[10px] font-black uppercase tracking-widest ${risk.text}`}>
                              {risk.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">In Stock</p>
                              <p className="mt-1 text-xl font-black text-white">{f.current_qty}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Daily Use</p>
                              <p className="mt-1 text-xl font-black text-white">{f.daily_consumption_rate}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Days Left</p>
                              <p className={`mt-1 text-xl font-black ${f.days_until_stockout <= 7 ? 'text-red-400' : f.days_until_stockout <= 21 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {f.days_until_stockout >= 999 ? '∞' : f.days_until_stockout}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reorder Qty</p>
                              <p className="mt-1 text-xl font-black text-teal-400">{f.suggested_reorder_qty}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Order By</p>
                              <p className="mt-1 text-sm font-black text-white">{f.suggested_reorder_by || '—'}</p>
                            </div>
                          </div>
                        </div>

                        {f.reasoning && (
                          <p className="mt-3 border-t border-white/5 pt-3 text-xs font-semibold text-slate-400">
                            {f.reasoning}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
