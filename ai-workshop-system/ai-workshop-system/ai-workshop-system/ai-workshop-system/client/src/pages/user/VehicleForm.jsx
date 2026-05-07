import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

export default function VehicleForm() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
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
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.user_id) {
      toast.error('Please log in again before adding a vehicle')
      navigate('/user/login', { replace: true })
      return
    }
    setLoading(true)
    try {
      await api.post('/vehicles', { ...form, user_id: user.user_id })
      toast.success('Vehicle added successfully')
      navigate('/user/service', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Add New Vehicle">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-10 py-12 text-white">
            <h2 className="text-3xl font-black mb-2">Vehicle Details</h2>
            <p className="text-blue-100 opacity-80">Tell us about the car you'd like to bring in for service.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Make</label>
                <input name="make" placeholder="e.g. Toyota" className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Model</label>
                <input name="model" placeholder="e.g. Corolla" className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Year</label>
                <input name="year" type="number" placeholder="2024" className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Registration Number</label>
                <input name="registration_number" placeholder="ABC 123 GP" className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">VIN (Optional)</label>
                <input name="vin" placeholder="17-digit number" className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Current Mileage</label>
                <input name="mileage" type="number" placeholder="e.g. 45000" className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Color</label>
                <input name="color" placeholder="e.g. Metallic Silver" className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-lg hover:bg-blue-700 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Vehicle...' : 'Register Vehicle & Continue'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
