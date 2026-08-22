import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'
import JobContextPanel from './JobContextPanel'


const STAR = '★'
const STAR_EMPTY = '☆'

function Stars({ rating }) {
  const full = Math.round(Number(rating) || 0)
  return (
    <span className="text-amber-400 text-xs tracking-wider">
      {STAR.repeat(Math.min(full, 5))}{STAR_EMPTY.repeat(Math.max(5 - full, 0))}
    </span>
  )
}

export default function SupplierMarketplace() {
  const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
  const [parts, setParts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [selectedPart, setSelectedPart] = useState(null)
  const [comparison, setComparison] = useState([])
  const [loadingCompare, setLoadingCompare] = useState(false)
  const [ordering, setOrdering] = useState(null)
  const [orderQty, setOrderQty] = useState(1)
  const [recentOrders, setRecentOrders] = useState([])
  const [loadingInit, setLoadingInit] = useState(true)

  // Load parts + suppliers + recent orders on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [p, s, o] = await Promise.all([
          api.get('/inventory/parts'),
          api.get('/inventory/suppliers'),
          api.get('/inventory/supplier-orders'),
        ])
        setParts(p.data)
        setSuppliers(s.data)
        setRecentOrders(o.data.filter(ord => ord.supplier_id))
      } finally {
        setLoadingInit(false)
      }
    }
    init()
  }, [])

  // Compare prices when a part is selected
  const comparePart = async (part) => {
    setSelectedPart(part)
    setComparison([])
    setLoadingCompare(true)
    try {
      const res = await api.get(`/inventory/suppliers/${part.part_id}/compare`)
      setComparison(res.data)
    } catch {
      toast.error('Failed to load price comparison')
    } finally {
      setLoadingCompare(false)
    }
  }

  // Place order from a supplier
  const placeOrder = async (supplierId) => {
    if (orderQty < 1 || !selectedPart) return
    setOrdering(supplierId)
    try {
      await api.post('/inventory/suppliers/order', {
        part_id: selectedPart.part_id,
        supplier_id: supplierId,
        quantity: orderQty,
        requested_by: admin?.user_id,
      })
      toast.success('Order placed successfully!')
      // Refresh orders
      const o = await api.get('/inventory/supplier-orders')
      setRecentOrders(o.data.filter(ord => ord.supplier_id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setOrdering(null)
    }
  }

  // Find cheapest and fastest
  const available = comparison.filter(c => c.price && c.in_stock !== false)
  const cheapest = available.length > 0 ? available.reduce((a, b) => Number(a.price) < Number(b.price) ? a : b) : null
  const fastest = available.length > 0 ? available.reduce((a, b) => a.delivery_days_min < b.delivery_days_min ? a : b) : null

  return (
    <AppLayout title="Supplier Marketplace">
      <JobContextPanel />
      <div className="space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-orange-500/15 via-slate-900/80 to-purple-500/10 p-8 shadow-2xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
              🏪 Supplier Network
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Compare prices across 5 suppliers
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300/80 sm:text-base">
              Select a part to see real-time pricing, stock availability, and delivery estimates from all supplier shops. Order directly from the best option.
            </p>
          </div>
        </section>

        {/* Supplier overview cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {suppliers.map(s => (
            <div key={s.supplier_id} className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full shadow-lg" style={{ backgroundColor: s.color }} />
                <h4 className="text-sm font-black text-white truncate">{s.name}</h4>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-400 truncate">📍 {s.location}</p>
              <div className="mt-3 flex items-center justify-between">
                <Stars rating={s.rating} />
                <span className="text-[10px] font-black text-slate-500">{s.delivery_days_min}-{s.delivery_days_max} days</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Part selector */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-lg font-black text-white">Select a Part</h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">Choose a part to compare supplier prices</p>

              {loadingInit ? (
                <div className="mt-6 flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500/20 border-t-orange-500" />
                </div>
              ) : parts.length === 0 ? (
                <p className="mt-6 text-sm font-bold text-slate-500">No parts in inventory. Add parts first.</p>
              ) : (
                <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-2">
                  {parts.map(p => (
                    <button
                      key={p.part_id}
                      type="button"
                      onClick={() => comparePart(p)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        selectedPart?.part_id === p.part_id
                          ? 'border-orange-500/40 bg-orange-500/10 scale-[1.02]'
                          : 'border-white/5 bg-slate-950/30 hover:bg-slate-950/50 hover:border-white/10'
                      }`}
                    >
                      <p className="font-black text-white truncate">{p.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs font-bold text-slate-400">
                        <span>SKU: {p.sku || '—'}</span>
                        <span>•</span>
                        <span>Stock: {p.quantity}</span>
                        {p.unit_price && (
                          <>
                            <span>•</span>
                            <span>R{Number(p.unit_price).toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Order quantity */}
            {selectedPart && (
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Order Quantity</p>
                <input
                  type="number"
                  min="1"
                  value={orderQty}
                  onChange={e => setOrderQty(Math.max(1, Number(e.target.value)))}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-2xl font-black text-white text-center outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}
          </div>

          {/* Comparison results */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedPart ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-white/10 bg-slate-900/60 py-24 shadow-2xl backdrop-blur-xl">
                <div className="text-6xl">🏪</div>
                <p className="text-lg font-black text-slate-400">Select a part to compare prices</p>
                <p className="text-sm font-semibold text-slate-500">Choose from the list on the left</p>
              </div>
            ) : loadingCompare ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-white/10 bg-slate-900/60 py-24 shadow-2xl backdrop-blur-xl">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-orange-500/20 border-t-orange-500" />
                <p className="text-sm font-bold text-slate-400 animate-pulse">Checking supplier prices...</p>
              </div>
            ) : (
              <>
                {/* Part header */}
                <div className="rounded-[2rem] border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-purple-500/10 p-6 shadow-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Comparing Prices For</p>
                  <h3 className="mt-2 text-2xl font-black text-white">{selectedPart.name}</h3>
                  <div className="mt-2 flex items-center gap-4 text-sm font-bold text-slate-400">
                    <span>SKU: {selectedPart.sku || '—'}</span>
                    <span>•</span>
                    <span>Your stock: {selectedPart.quantity}</span>
                    <span>•</span>
                    <span>{available.length} of {comparison.length} shops have it</span>
                  </div>
                </div>

                {/* Supplier price cards */}
                <div className="space-y-4">
                  {comparison.map((c, idx) => {
                    const isCheapest = cheapest && c.supplier_id === cheapest.supplier_id && available.length > 1
                    const isFastest = fastest && c.supplier_id === fastest.supplier_id && available.length > 1 && (!cheapest || fastest.supplier_id !== cheapest.supplier_id)
                    const outOfStock = c.in_stock === false || !c.price
                    const totalCost = c.price ? (Number(c.price) * orderQty).toFixed(2) : null

                    return (
                      <div
                        key={c.supplier_id}
                        className={`rounded-[2rem] border p-6 shadow-xl transition-all hover:scale-[1.005] ${
                          outOfStock
                            ? 'border-white/5 bg-slate-950/40 opacity-60'
                            : isCheapest
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-white/10 bg-slate-900/60 backdrop-blur-xl'
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className="h-4 w-4 shrink-0 rounded-full shadow-lg"
                              style={{ backgroundColor: c.color || '#64748b' }}
                            />
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-black text-white">{c.name}</h4>
                                {isCheapest && (
                                  <span className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    💰 Cheapest
                                  </span>
                                )}
                                {isFastest && (
                                  <span className="rounded-xl bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                    ⚡ Fastest
                                  </span>
                                )}
                                {outOfStock && (
                                  <span className="rounded-xl bg-red-500/20 border border-red-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-400">
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-slate-400">
                                <span>📍 {c.location}</span>
                                <span>•</span>
                                <span>📞 {c.contact_phone}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-3">
                                <Stars rating={c.rating} />
                                <span className="text-xs font-bold text-slate-500">
                                  🚚 {c.delivery_days_min}-{c.delivery_days_max} days delivery
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {!outOfStock && (
                              <>
                                <div className="text-right">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unit Price</p>
                                  <p className="mt-1 text-2xl font-black text-white">R{Number(c.price).toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total ({orderQty}x)</p>
                                  <p className={`mt-1 text-2xl font-black ${isCheapest ? 'text-emerald-400' : 'text-white'}`}>
                                    R{totalCost}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => placeOrder(c.supplier_id)}
                                  disabled={ordering === c.supplier_id}
                                  className="shrink-0 rounded-2xl bg-orange-500 px-6 py-3 font-black text-slate-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:opacity-60"
                                >
                                  {ordering === c.supplier_id ? (
                                    <span className="flex items-center gap-2">
                                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                                      Ordering...
                                    </span>
                                  ) : (
                                    'Order'
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Recent supplier orders */}
            {recentOrders.length > 0 && (
              <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="text-lg font-black text-white">Recent Supplier Orders</h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">Orders placed through the marketplace</p>
                <div className="mt-4 space-y-3">
                  {recentOrders.slice(0, 6).map(o => (
                    <div key={o.order_id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/30 p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: o.supplier_color || '#64748b' }}
                        />
                        <div>
                          <p className="font-black text-white">{o.part_name}</p>
                          <p className="text-xs font-semibold text-slate-400">
                            from {o.supplier_name} • Qty: {o.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                          {o.status}
                        </span>
                        <p className="mt-1 text-[10px] font-bold text-slate-500">
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
