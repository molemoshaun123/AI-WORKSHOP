import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

export default function ServiceRequest() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [form, setForm] = useState({
    user_id: user?.user_id || 1,
    vehicle_id: '',
    title: '',
    symptoms: '',
    priority: 'normal',
    appointment_date: '',
  })
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) return
      try {
        const res = await api.get(`/vehicles/user/${user.user_id}`)
        setVehicles(res.data)
        if (res.data.length > 0) {
          setForm(prev => ({ ...prev, vehicle_id: res.data[0].vehicle_id }))
        }
      } catch (err) {
        console.error('Failed to fetch vehicles')
      }
    }
    fetchVehicles()
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('booking_helper_prefill')
      if (!raw) return
      const data = JSON.parse(raw)
      sessionStorage.removeItem('booking_helper_prefill')
      setForm((prev) => ({
        ...prev,
        title: data?.draft_title ? String(data.draft_title) : prev.title,
        symptoms: data?.draft_symptoms ? String(data.draft_symptoms) : prev.symptoms,
        appointment_date: data?.draft_appointment_date_iso
          ? new Date(new Date(data.draft_appointment_date_iso).getTime() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)
          : prev.appointment_date,
      }))
    } catch {}
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.vehicle_id) return toast.error('Please register a vehicle first')
    
    setLoading(true)
    try {
      await api.post('/jobs', form)
      toast.error('Service request submitted successfully')
      navigate('/user/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Request Service">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-10 py-12 text-white">
            <h2 className="text-3xl font-black mb-2">Service Details</h2>
            <p className="text-emerald-100 opacity-80">Describe the issues you're experiencing with your vehicle.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Select Vehicle</label>
              {vehicles.length > 0 ? (
                <select 
                  name="vehicle_id" 
                  className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.5rem] bg-[right_1rem_center] bg-no-repeat" 
                  onChange={handleChange}
                  value={form.vehicle_id}
                >
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.make} {v.model} ({v.registration_number})</option>
                  ))}
                </select>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex justify-between items-center">
                  <span>No vehicles registered yet.</span>
                  <button type="button" onClick={() => navigate('/user/vehicle')} className="font-bold underline">Add one now</button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Job Title</label>
              <input name="title" value={form.title} placeholder="e.g. Annual Service or Strange Noise" className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" onChange={handleChange} required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Symptoms & Description</label>
              <textarea name="symptoms" value={form.symptoms} placeholder="Describe what's wrong in detail..." className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-all h-40 resize-none" onChange={handleChange} required></textarea>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Preferred Booking Date (Optional)</label>
              <input
                name="appointment_date"
                type="datetime-local"
                className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                onChange={handleChange}
                value={form.appointment_date}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Priority Level</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['low', 'normal', 'high', 'urgent'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                    className={`py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${
                      form.priority === p 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                        : 'border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button 
              disabled={loading || !form.vehicle_id}
              className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-lg hover:bg-emerald-700 hover:scale-[1.01] transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Submitting...' : 'Send Service Request'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
