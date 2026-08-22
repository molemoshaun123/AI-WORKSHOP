import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import UserLayout from '../../layouts/UserLayout'
import api from '../../services/api'
import ConfirmModal from '../../components/ConfirmModal'
import SlidePanel from '../../components/SlidePanel'
import { Car, Edit, Plus, Trash2, Camera } from 'lucide-react'

export default function VehicleForm() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  
  const [form, setForm] = useState({
    user_id: user?.user_id || 1,
    make: '',
    model: '',
    year: '',
    registration_number: '',
    vin: '',
    color: '',
    mileage: '',
  })
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const navigate = useNavigate()

  const loadVehicles = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await api.get(`/vehicles/user/${user.user_id}`)
      setVehicles(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openAdd = () => {
    setEditingVehicle(null)
    setForm({
      user_id: user?.user_id || 1,
      make: '', model: '', year: '', registration_number: '', vin: '', color: '', mileage: '',
    })
    setIsPanelOpen(true)
  }

  const openEdit = (v) => {
    setEditingVehicle(v)
    setForm({
      user_id: v.user_id,
      make: v.make || '',
      model: v.model || '',
      year: v.year || '',
      registration_number: v.registration_number || '',
      vin: v.vin || '',
      color: v.color || '',
      mileage: v.mileage || '',
    })
    setIsPanelOpen(true)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        try {
          const base64data = reader.result
          const res = await api.post('/images', {
            image: base64data,
            mimeType: file.type,
            type: 'vin',
          })
          
          const data = res.data.analysis
          if (data && !data.error) {
            setForm((prev) => ({
              ...prev,
              make: data.make || prev.make,
              model: data.model || prev.model,
              year: data.year || prev.year,
              vin: data.vin || prev.vin,
              registration_number: data.registration_number || prev.registration_number,
            }))
            toast.success('Vehicle details extracted successfully!')
          } else {
            toast.error(data?.message || 'Could not extract vehicle details.')
          }
        } catch (err) {
          console.error('Scan error:', err)
          toast.error(err.response?.data?.rejection_reason || err.response?.data?.message || 'Failed to scan image')
        } finally {
          setScanning(false)
        }
      }
    } catch (err) {
      toast.error('Failed to read image file')
      setScanning(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.user_id) {
      toast.error('Please log in again before adding a vehicle')
      navigate('/user/login', { replace: true })
      return
    }
    setSaving(true)
    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.vehicle_id}`, form)
        toast.success('Vehicle updated successfully')
      } else {
        await api.post('/vehicles', { ...form, user_id: user.user_id })
        toast.success('Vehicle added successfully')
      }
      setIsPanelOpen(false)
      loadVehicles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await api.delete(`/vehicles/${deletingId}`)
      toast.success('Vehicle deleted')
      loadVehicles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete vehicle')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <UserLayout title="My Vehicles">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Saved Vehicles</h2>
            <p className="text-sm font-semibold text-slate-400">Manage your garage for easy booking.</p>
          </div>
          <button 
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold">Loading your garage...</div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-950 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-black text-white">No vehicles yet</h3>
            <p className="text-sm text-slate-500 mt-2">Add your first vehicle to start booking services.</p>
          </div>
        ) : (
          <div className="grid gap-6 p-8 md:grid-cols-2 xl:grid-cols-3">
            {vehicles.map(v => (
              <div key={v.vehicle_id} className="bg-slate-950/50 border border-white/10 rounded-2xl p-6 relative group hover:border-blue-500/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl border border-blue-500/20">
                    <Car className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(v)} className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-white/5 hover:bg-slate-800 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingId(v.vehicle_id)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 rounded-lg border border-white/5 hover:bg-slate-800 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-white mb-1">{v.year} {v.make}</h3>
                <p className="text-slate-400 font-bold mb-4">{v.model}</p>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 bg-slate-900 rounded-xl p-4 border border-white/5">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1">Reg</p>
                    <p className="text-slate-300">{v.registration_number}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1">Color</p>
                    <p className="text-slate-300">{v.color || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SlidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        subtitle={editingVehicle ? 'Update your vehicle details.' : "Tell us about the car you'd like to bring in."}
      >
        <div className="p-6">
          {!editingVehicle && (
            <div className="bg-slate-950/50 border-2 border-dashed border-white/10 rounded-2xl p-6 text-center relative group hover:border-blue-500/50 transition-colors mb-8">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleScan}
                disabled={scanning}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
              />
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl ${scanning ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-slate-900 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors'}`}>
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{scanning ? 'Extracting details...' : 'Scan License Disk'}</h3>
                  <p className="text-xs text-slate-500 mt-1">Take a photo to auto-fill details instantly.</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm font-bold">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Make</label>
              <input name="make" value={form.make} onChange={handleChange} placeholder="e.g. Toyota" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Model</label>
              <input name="model" value={form.model} onChange={handleChange} placeholder="e.g. Corolla" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Year</label>
                <input name="year" type="number" value={form.year} onChange={handleChange} placeholder="2024" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration</label>
                <input name="registration_number" value={form.registration_number} onChange={handleChange} placeholder="ABC 123 GP" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">VIN (Optional)</label>
              <input name="vin" value={form.vin} onChange={handleChange} placeholder="17-digit number" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color (Optional)</label>
                <input name="color" value={form.color} onChange={handleChange} placeholder="e.g. Silver" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mileage (Optional)</label>
                <input name="mileage" type="number" value={form.mileage} onChange={handleChange} placeholder="45000" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
              </div>
            </div>

            <button 
              disabled={saving}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : (editingVehicle ? 'Update Vehicle' : 'Save Vehicle')}
            </button>
          </form>
        </div>
      </SlidePanel>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message="Are you sure you want to remove this vehicle? This action cannot be undone unless it has active service jobs."
        confirmText="Delete Vehicle"
        isDanger={true}
      />
    </UserLayout>
  )
}
