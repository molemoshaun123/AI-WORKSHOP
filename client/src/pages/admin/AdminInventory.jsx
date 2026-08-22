import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'
import ConfirmModal from '../../components/ConfirmModal'
import SlidePanel from '../../components/SlidePanel'
import { Edit2, Trash2, Plus, Minus } from 'lucide-react'

export default function AdminInventory() {
  const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
  const [parts, setParts] = useState([])
  const [orders, setOrders] = useState([])
  const [reorderSuggestions, setReorderSuggestions] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', sku: '', quantity: 0, unit_price: '', reorder_level: 0 })
  const [orderForm, setOrderForm] = useState({ part_id: '', quantity: 1, job_id: '', supplier_id: '' })
  const [supplierPrices, setSupplierPrices] = useState([])
  const [loadingPrices, setLoadingPrices] = useState(false)

  // Expanded reorder comparison state
  const [expandedReorder, setExpandedReorder] = useState(null)
  const [reorderPrices, setReorderPrices] = useState([])
  const [loadingReorderPrices, setLoadingReorderPrices] = useState(false)

  // Edit and Delete state
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [editingPart, setEditingPart] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [partToDelete, setPartToDelete] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [p, o, r, s] = await Promise.all([
        api.get('/inventory/parts'),
        api.get('/inventory/orders'),
        api.get('/inventory/reorder-suggestions'),
        api.get('/inventory/suppliers'),
      ])
      setParts(p.data)
      setOrders(o.data)
      setReorderSuggestions(r.data)
      setSuppliers(s.data)
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

  // Fetch supplier prices when part selection changes in order form
  const fetchPricesForPart = async (partId) => {
    if (!partId) { setSupplierPrices([]); return }
    setLoadingPrices(true)
    try {
      const res = await api.get(`/inventory/suppliers/${partId}/compare`)
      setSupplierPrices(res.data.filter(sp => sp.price && sp.in_stock !== false))
    } catch { setSupplierPrices([]) }
    finally { setLoadingPrices(false) }
  }

  // When part changes, fetch prices
  const handlePartChange = (partId) => {
    setOrderForm((prev) => ({ ...prev, part_id: partId, supplier_id: '' }))
    fetchPricesForPart(partId)
  }

  // Fetch supplier prices for a reorder suggestion (inline expand)
  const toggleReorderCompare = async (partId) => {
    if (expandedReorder === partId) { setExpandedReorder(null); return }
    setExpandedReorder(partId)
    setReorderPrices([])
    setLoadingReorderPrices(true)
    try {
      const res = await api.get(`/inventory/suppliers/${partId}/compare`)
      setReorderPrices(res.data)
    } catch { setReorderPrices([]) }
    finally { setLoadingReorderPrices(false) }
  }

  // Order from supplier via reorder suggestion
  const quickReorderFromSupplier = async (partId, quantity, supplierId) => {
    try {
      await api.post('/inventory/suppliers/order', {
        part_id: Number(partId),
        supplier_id: Number(supplierId),
        quantity: Number(quantity),
        requested_by: admin?.user_id,
      })
      toast.success('Order placed with supplier!')
      load()
      setExpandedReorder(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order')
    }
  }

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
      toast.success('Part added successfully')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create part')
    }
  }

  const updatePart = async (e) => {
    e.preventDefault()
    if (!editingPart) return
    try {
      await api.put(`/inventory/parts/${editingPart.part_id}`, {
        name: editingPart.name,
        sku: editingPart.sku,
        quantity: Number(editingPart.quantity || 0),
        unit_price: editingPart.unit_price ? Number(editingPart.unit_price) : null,
        reorder_level: Number(editingPart.reorder_level || 0),
      })
      setIsEditPanelOpen(false)
      setEditingPart(null)
      toast.success('Part updated successfully')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update part')
    }
  }

  const handleDeletePart = async () => {
    if (!partToDelete) return
    try {
      await api.delete(`/inventory/parts/${partToDelete.part_id}`)
      toast.success('Part deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete part')
    }
  }

  const adjustStock = async (partId, delta) => {
    try {
      await api.put(`/inventory/parts/${partId}/adjust`, { delta })
      toast.success('Stock adjusted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust stock')
    }
  }

  const createOrder = async (e) => {
    e.preventDefault()
    try {
      if (orderForm.supplier_id) {
        // Order through supplier
        await api.post('/inventory/suppliers/order', {
          part_id: Number(orderForm.part_id),
          supplier_id: Number(orderForm.supplier_id),
          quantity: Number(orderForm.quantity),
          job_id: orderForm.job_id ? Number(orderForm.job_id) : null,
          requested_by: admin?.user_id,
        })
      } else {
        // Regular order (no supplier)
        await api.post('/inventory/orders', {
          part_id: Number(orderForm.part_id),
          quantity: Number(orderForm.quantity),
          job_id: orderForm.job_id ? Number(orderForm.job_id) : null,
          requested_by: admin?.user_id,
        })
      }
      setOrderForm((prev) => ({ ...prev, quantity: 1, job_id: '', supplier_id: '' }))
      setSupplierPrices([])
      toast.success('Order submitted!')
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

  // Find selected supplier price
  const selectedSupplierPrice = supplierPrices.find(sp => String(sp.supplier_id) === String(orderForm.supplier_id))
  const totalCost = selectedSupplierPrice ? (Number(selectedSupplierPrice.price) * Number(orderForm.quantity || 1)).toFixed(2) : null

  return (
    <AppLayout title="Inventory">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          {/* ── Reorder Suggestions ── */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Auto Reorder Suggestions</h3>
                <p className="text-slate-400 text-sm font-semibold">Low stock parts — compare supplier prices before ordering</p>
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
                  <div key={s.part_id} className="rounded-[2rem] bg-slate-950/30 border border-white/5 overflow-hidden">
                    <div className="p-5 flex justify-between gap-6">
                      <div className="overflow-hidden">
                        <p className="text-white font-black truncate">{s.name}</p>
                        <p className="text-slate-400 text-xs font-bold mt-2">
                          SKU: {s.sku || '-'} • Stock: {s.quantity} • Reorder: {s.reorder_level} • Open orders: {s.open_order_qty}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                          Need {s.suggested_order_qty}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleReorderCompare(s.part_id)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            expandedReorder === s.part_id
                              ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300'
                              : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20'
                          }`}
                        >
                          {expandedReorder === s.part_id ? 'Close' : '🏪 Compare Suppliers'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded supplier comparison */}
                    {expandedReorder === s.part_id && (
                      <div className="border-t border-white/5 bg-slate-950/20 p-5">
                        {loadingReorderPrices ? (
                          <div className="flex items-center gap-3 py-4 justify-center">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500/20 border-t-orange-500" />
                            <span className="text-xs font-bold text-slate-400">Loading supplier prices...</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                              Prices for {s.suggested_order_qty} units from each supplier
                            </p>
                            {reorderPrices.map((sp) => {
                              const isAvailable = sp.price && sp.in_stock !== false
                              const cheapestPrice = Math.min(...reorderPrices.filter(r => r.price && r.in_stock !== false).map(r => Number(r.price)))
                              const isCheapest = isAvailable && Number(sp.price) === cheapestPrice && reorderPrices.filter(r => r.price && r.in_stock !== false).length > 1
                              const total = isAvailable ? (Number(sp.price) * s.suggested_order_qty).toFixed(2) : null

                              return (
                                <div
                                  key={sp.supplier_id}
                                  className={`flex items-center justify-between rounded-2xl p-3 border transition-all ${
                                    !isAvailable
                                      ? 'border-white/5 bg-slate-950/30 opacity-50'
                                      : isCheapest
                                      ? 'border-emerald-500/30 bg-emerald-500/5'
                                      : 'border-white/5 bg-slate-950/30 hover:bg-slate-900/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: sp.color || '#64748b' }} />
                                    <div>
                                      <span className="text-sm font-black text-white">{sp.name}</span>
                                      <span className="ml-2 text-[10px] font-bold text-slate-500">{sp.delivery_days_min}-{sp.delivery_days_max}d</span>
                                      {isCheapest && (
                                        <span className="ml-2 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase">Best Price</span>
                                      )}
                                      {!isAvailable && (
                                        <span className="ml-2 px-2 py-0.5 rounded-lg bg-red-500/20 text-[9px] font-black text-red-400 uppercase">Unavailable</span>
                                      )}
                                    </div>
                                  </div>
                                  {isAvailable && (
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <p className="text-xs font-bold text-slate-500">R{Number(sp.price).toFixed(2)} each</p>
                                        <p className="text-sm font-black text-white">R{total} total</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => quickReorderFromSupplier(s.part_id, s.suggested_order_qty, sp.supplier_id)}
                                        className="px-4 py-2 rounded-xl bg-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
                                      >
                                        Order
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Parts Table ── */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Parts</h3>
                <p className="text-slate-400 text-sm font-semibold">Track stock levels and reorder points</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/admin/ai/supplier-marketplace"
                  className="px-4 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest text-orange-300 hover:bg-orange-500/20 transition-all"
                >
                  🏪 Full Marketplace
                </Link>
                <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300">
                  {parts.length} Items
                </div>
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
                      <th className="text-left p-5">Price</th>
                      <th className="text-right p-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => (
                      <tr key={p.part_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-5 font-bold">{p.name}</td>
                        <td className="p-5 text-slate-300 font-semibold">{p.sku || '-'}</td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => adjustStock(p.part_id, -1)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                p.quantity <= (p.reorder_level || 0)
                                  ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              }`}
                            >
                              {p.quantity}
                            </span>
                            <button onClick={() => adjustStock(p.part_id, 1)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-5 text-slate-400 font-semibold">{p.reorder_level || 0}</td>
                        <td className="p-5 text-slate-300 font-semibold">
                          {p.unit_price ? `R${Number(p.unit_price).toFixed(2)}` : '-'}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setEditingPart(p); setIsEditPanelOpen(true) }}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                              title="Edit Part"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setPartToDelete(p); setIsDeleteModalOpen(true) }}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Delete Part"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Order Parts (with supplier selector) ── */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5">
              <h3 className="text-xl font-black">Order Parts</h3>
              <p className="text-slate-400 text-sm font-semibold">Choose a supplier to see their price, or order without a supplier</p>
            </div>
            <form onSubmit={createOrder} className="p-8 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <select
                  value={orderForm.part_id}
                  onChange={(e) => handlePartChange(e.target.value)}
                  className="bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {parts.map((p) => (
                    <option key={p.part_id} value={p.part_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={orderForm.supplier_id}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, supplier_id: e.target.value }))}
                  className="bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">No supplier (internal)</option>
                  {suppliers.map((s) => {
                    const priceInfo = supplierPrices.find(sp => String(sp.supplier_id) === String(s.supplier_id))
                    const priceLabel = priceInfo && priceInfo.in_stock !== false
                      ? ` — R${Number(priceInfo.price).toFixed(2)}`
                      : priceInfo ? ' — Out of Stock' : ''
                    return (
                      <option
                        key={s.supplier_id}
                        value={s.supplier_id}
                        disabled={priceInfo && priceInfo.in_stock === false}
                      >
                        {s.name}{priceLabel}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
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
              </div>

              {/* Live price preview when supplier is selected */}
              {selectedSupplierPrice && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedSupplierPrice.color || '#f97316' }} />
                    <div>
                      <p className="text-xs font-black text-orange-300">{selectedSupplierPrice.name}</p>
                      <p className="text-[10px] font-bold text-slate-500">
                        📍 {selectedSupplierPrice.location} • 🚚 {selectedSupplierPrice.delivery_days_min}-{selectedSupplierPrice.delivery_days_max} days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400">R{Number(selectedSupplierPrice.price).toFixed(2)} × {orderForm.quantity || 1}</p>
                    <p className="text-xl font-black text-white">R{totalCost}</p>
                  </div>
                </div>
              )}

              {loadingPrices && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500/20 border-t-orange-500" />
                  Loading supplier prices...
                </div>
              )}

              <button className="w-full bg-cyan-400 text-slate-950 font-black py-4 rounded-2xl hover:bg-cyan-300 transition-all">
                {orderForm.supplier_id ? '🏪 Order from Supplier' : 'Submit Internal Order'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          {/* ── Add New Part ── */}
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

          {/* ── Orders ── */}
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
                        {o.supplier_name && (
                          <div className="mt-2 flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: o.supplier_color || '#64748b' }}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-300">
                              {o.supplier_name}
                            </span>
                          </div>
                        )}
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

      {/* Edit Part Panel */}
      <SlidePanel
        isOpen={isEditPanelOpen}
        onClose={() => { setIsEditPanelOpen(false); setEditingPart(null) }}
        title="Edit Part"
      >
        {editingPart && (
          <form onSubmit={updatePart} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Part Name</label>
              <input
                value={editingPart.name}
                onChange={(e) => setEditingPart((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SKU</label>
              <input
                value={editingPart.sku || ''}
                onChange={(e) => setEditingPart((prev) => ({ ...prev, sku: e.target.value }))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editingPart.quantity}
                  onChange={(e) => setEditingPart((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={editingPart.reorder_level}
                  onChange={(e) => setEditingPart((prev) => ({ ...prev, reorder_level: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Price (R)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editingPart.unit_price || ''}
                onChange={(e) => setEditingPart((prev) => ({ ...prev, unit_price: e.target.value }))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>
            <div className="pt-4 mt-6 border-t border-white/10">
              <button type="submit" className="w-full bg-cyan-500 text-slate-950 font-black py-3 rounded-xl hover:bg-cyan-400 transition-colors">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </SlidePanel>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setPartToDelete(null) }}
        onConfirm={handleDeletePart}
        title="Delete Part"
        message={`Are you sure you want to delete ${partToDelete?.name}? This action cannot be undone and will fail if the part has active orders.`}
        confirmText="Delete Part"
        isDanger={true}
      />
    </AppLayout>
  )
}
