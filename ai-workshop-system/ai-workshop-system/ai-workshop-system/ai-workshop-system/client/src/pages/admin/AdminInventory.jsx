import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

export default function AdminInventory() {
  const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
  const [parts, setParts] = useState([])
  const [orders, setOrders] = useState([])
  const [reorderSuggestions, setReorderSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', sku: '', quantity: 0, unit_price: '', reorder_level: 0 })
  const [orderForm, setOrderForm] = useState({ part_id: '', quantity: 1, job_id: '' })

  const load = async () => {
    setLoading(true)
    try {
      const [p, o, r] = await Promise.all([
        api.get('/inventory/parts'),
        api.get('/inventory/orders'),
        api.get('/inventory/reorder-suggestions'),
      ])
      setParts(p.data)
      setOrders(o.data)
      setReorderSuggestions(r.data)
      if (p.data.length && !orderForm.part_id) {
        setOrderForm((prev) => ({ ...prev, part_id: p.data[0].part_id }))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const createPart = async (e) => {
    e.preventDefault()
    try {
      await api.post('/inventory/parts', {
        name: form.name,
        sku: form.sku,
        quantity: Number(form.quantity || 0),
        unit_price: form.unit_price ? Number(form.unit_price) : null,
        reorder_level: Number(form.reorder_level || 0),
      })
      setForm({ name: '', sku: '', quantity: 0, unit_price: '', reorder_level: 0 })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create part')
    }
  }

  const createOrder = async (e) => {
    e.preventDefault()
    try {
      await api.post('/inventory/orders', {
        part_id: Number(orderForm.part_id),
        quantity: Number(orderForm.quantity),
        job_id: orderForm.job_id ? Number(orderForm.job_id) : null,
        requested_by: admin?.user_id,
      })
      setOrderForm((prev) => ({ ...prev, quantity: 1, job_id: '' }))
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order')
    }
  }

  const markOrder = async (order_id, status) => {
    try {
      await api.put(`/inventory/orders/${order_id}`, { status })
      load()
    } catch (err) {
      toast.error('Failed to update order')
    }
  }

  const quickReorder = async (part_id, quantity) => {
    try {
      await api.post('/inventory/orders', {
        part_id: Number(part_id),
        quantity: Number(quantity),
        job_id: null,
        requested_by: admin?.user_id,
      })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create reorder')
    }
  }

  return (
    <AppLayout title="Inventory">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Auto Reorder Suggestions</h3>
                <p className="text-slate-400 text-sm font-semibold">Low stock parts detected from reorder levels</p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300">
                {reorderSuggestions.length} Alerts
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-slate-400 font-bold">Loading...</div>
            ) : reorderSuggestions.length === 0 ? (
              <div className="p-8 text-slate-500 font-bold">No reorder alerts.</div>
            ) : (
              <div className="p-6 space-y-3">
                {reorderSuggestions.slice(0, 8).map((s) => (
                  <div key={s.part_id} className="p-5 rounded-[2rem] bg-slate-950/30 border border-white/5 flex justify-between gap-6">
                    <div className="overflow-hidden">
                      <p className="text-white font-black truncate">{s.name}</p>
                      <p className="text-slate-400 text-xs font-bold mt-2">
                        SKU: {s.sku || '-'} • Stock: {s.quantity} • Reorder: {s.reorder_level} • Open orders: {s.open_order_qty}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                        Suggested {s.suggested_order_qty}
                      </div>
                      <button
                        type="button"
                        onClick={() => quickReorder(s.part_id, s.suggested_order_qty)}
                        className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
                      >
                        Create Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Parts</h3>
                <p className="text-slate-400 text-sm font-semibold">Track stock levels and reorder points</p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300">
                {parts.length} Items
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-slate-400 font-bold">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                    <tr className="border-b border-white/5">
                      <th className="text-left p-5">Part</th>
                      <th className="text-left p-5">SKU</th>
                      <th className="text-left p-5">Stock</th>
                      <th className="text-left p-5">Reorder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => (
                      <tr key={p.part_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-5 font-bold">{p.name}</td>
                        <td className="p-5 text-slate-300 font-semibold">{p.sku || '-'}</td>
                        <td className="p-5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              p.quantity <= (p.reorder_level || 0)
                                ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            }`}
                          >
                            {p.quantity}
                          </span>
                        </td>
                        <td className="p-5 text-slate-400 font-semibold">{p.reorder_level || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5">
              <h3 className="text-xl font-black">Order Parts</h3>
              <p className="text-slate-400 text-sm font-semibold">Request parts for a job or restocking</p>
            </div>
            <form onSubmit={createOrder} className="p-8 grid md:grid-cols-3 gap-4">
              <select
                value={orderForm.part_id}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, part_id: e.target.value }))}
                className="bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {parts.map((p) => (
                  <option key={p.part_id} value={p.part_id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                value={orderForm.quantity}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, quantity: e.target.value }))}
                type="number"
                min="1"
                placeholder="Qty"
                className="bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <input
                value={orderForm.job_id}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, job_id: e.target.value }))}
                placeholder="Job ID (optional)"
                className="bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button className="md:col-span-3 bg-cyan-400 text-slate-950 font-black py-4 rounded-2xl hover:bg-cyan-300 transition-all">
                Submit Order
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5">
              <h3 className="text-xl font-black">Add New Part</h3>
              <p className="text-slate-400 text-sm font-semibold">Create an inventory item</p>
            </div>
            <form onSubmit={createPart} className="p-8 space-y-4">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Part name"
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="SKU (optional)"
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  type="number"
                  min="0"
                  placeholder="Quantity"
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  value={form.reorder_level}
                  onChange={(e) => setForm((prev) => ({ ...prev, reorder_level: e.target.value }))}
                  type="number"
                  min="0"
                  placeholder="Reorder level"
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <input
                value={form.unit_price}
                onChange={(e) => setForm((prev) => ({ ...prev, unit_price: e.target.value }))}
                type="number"
                min="0"
                step="0.01"
                placeholder="Unit price (optional)"
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all">
                Add Part
              </button>
            </form>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Orders</h3>
                <p className="text-slate-400 text-sm font-semibold">Track requested parts</p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300">
                {orders.length} Orders
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-slate-400 font-bold">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-slate-500 font-bold">No orders yet.</div>
            ) : (
              <div className="p-6 space-y-3">
                {orders.slice(0, 8).map((o) => (
                  <div key={o.order_id} className="p-5 rounded-[2rem] bg-slate-950/30 border border-white/5">
                    <div className="flex justify-between gap-6">
                      <div>
                        <p className="text-white font-black">{o.part_name}</p>
                        <p className="text-slate-400 text-xs font-bold">Qty: {o.quantity}{o.job_id ? ` • Job #${o.job_id}` : ''}</p>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">
                          Requested by: {o.requested_by_name || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                          {o.status}
                        </span>
                        <div className="mt-3 flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => markOrder(o.order_id, 'approved')}
                            className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => markOrder(o.order_id, 'ordered')}
                            className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
                          >
                            Ordered
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
