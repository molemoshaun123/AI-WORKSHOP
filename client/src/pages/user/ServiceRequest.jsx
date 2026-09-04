import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import UserLayout from '../../layouts/UserLayout'
import api from '../../services/api'

export default function ServiceRequest() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    user_id: user?.user_id || 1,
    vehicle_id: '',
    title: '',
    symptoms: '',
    priority: 'normal',
    appointment_date: '',
    image_url: '',
  })
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [timeEstimate, setTimeEstimate] = useState(null)
  const [estimating, setEstimating] = useState(false)
  const navigate = useNavigate()

  const getNext7Days = () => {
    const days = []
    let i = 1
    while (days.length < 6) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      // Skip Sundays (0)
      if (d.getDay() !== 0) days.push(d)
      i++
    }
    return days
  }
  
  const nextWorkingDays = getNext7Days()
  const timeSlots = ['09:00', '11:00', '14:00', '16:00']

  const selectTimeSlot = (day, time) => {
    const yyyy = day.getFullYear()
    const mm = String(day.getMonth() + 1).padStart(2, '0')
    const dd = String(day.getDate()).padStart(2, '0')
    setForm(prev => ({ ...prev, appointment_date: `${yyyy}-${mm}-${dd}T${time}` }))
  }

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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file size (limit to 5MB for base64)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Please select an image under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      setForm({ ...form, image_url: reader.result })
    }
  }

  const getTimeEstimate = async () => {
    if (!form.symptoms.trim()) return toast.error('Describe the problem first')
    setEstimating(true)
    setTimeEstimate(null)
    try {
      const selectedVehicle = vehicles.find((v) => String(v.vehicle_id) === String(form.vehicle_id))
      const res = await api.post('/ai/repair-time-estimate', {
        symptoms: form.symptoms,
        vehicleDetails: selectedVehicle ? { make: selectedVehicle.make, model: selectedVehicle.model, year: selectedVehicle.year, mileage: selectedVehicle.mileage } : {},
      })
      let data = res.data?.estimate
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setTimeEstimate(data)
    } catch (e) {
      toast.error('Could not get time estimate')
    } finally {
      setEstimating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.vehicle_id) return toast.error('Please register a vehicle first')
    
    setLoading(true)
    try {
      await api.post('/jobs', form)
      toast.success('Service request submitted successfully')
      navigate('/user/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserLayout title="Request Service">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-10 py-12 text-white">
            <h2 className="text-3xl font-black mb-2">Service Details</h2>
            <p className="text-blue-100 opacity-80">Describe the issues you're experiencing with your vehicle.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Select Vehicle</label>
              {vehicles.length > 0 ? (
                <select 
                  name="vehicle_id" 
                  className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.5rem] bg-[right_1rem_center] bg-no-repeat" 
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
              <input name="title" value={form.title} placeholder="e.g. Annual Service or Strange Noise" className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Symptoms & Description</label>
              <textarea name="symptoms" value={form.symptoms} placeholder="Describe what's wrong in detail..." className="w-full border-slate-200 border p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all h-40 resize-none" onChange={handleChange} required></textarea>
              <button
                type="button"
                onClick={getTimeEstimate}
                disabled={estimating || !form.symptoms.trim()}
                className="w-full mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 rounded-2xl text-sm hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
              >
                {estimating ? '⏳ Estimating...' : '⏱️ Get AI Time Estimate'}
              </button>

              {timeEstimate && (
                <div className="mt-3 p-5 rounded-2xl bg-blue-50 border border-blue-200 text-slate-700 space-y-2">
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest">⏱️ Estimated Repair Time</p>
                  <div className="flex gap-4 mt-2">
                    <div className="flex-1 p-3 rounded-xl bg-white border border-blue-100 text-center">
                      <p className="text-2xl font-black text-blue-700">{timeEstimate.estimated_hours_min || '?'} - {timeEstimate.estimated_hours_max || '?'}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Hours</p>
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-white border border-blue-100 text-center">
                      <p className="text-2xl font-black text-blue-700">{timeEstimate.estimated_days_min || '?'} - {timeEstimate.estimated_days_max || '?'}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Days</p>
                    </div>
                  </div>
                  {timeEstimate.scheduling_notes && (
                    <p className="text-xs font-semibold text-slate-600 mt-2">📌 {timeEstimate.scheduling_notes}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Attach a Photo (Optional)</label>
              <div className="relative">
                {form.image_url ? (
                  <div className="relative inline-block w-full">
                    <img src={form.image_url} alt="Attached" className="max-h-64 w-full object-cover rounded-2xl border border-slate-200" />
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, image_url: ''})}
                      className="absolute top-4 right-4 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors relative cursor-pointer group">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600">Click or tap to attach a photo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1">Preferred Booking Date (Optional)</label>
              
              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6">
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                  {nextWorkingDays.map((day, i) => {
                    const isTomorrow = i === 0
                    const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })
                    const dayNum = day.getDate()
                    const month = day.toLocaleDateString('en-US', { month: 'short' })
                    
                    return (
                      <div key={i} className="flex-shrink-0 w-40 snap-start bg-white border border-slate-200 rounded-2xl p-4 flex flex-col shadow-sm">
                        <div className="text-center mb-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{month} {dayName}</p>
                          <p className="text-2xl font-black text-slate-900">{dayNum}</p>
                          {isTomorrow && <span className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 inline-block">Tomorrow</span>}
                        </div>
                        <div className="space-y-2 mt-auto">
                          {timeSlots.map(time => {
                            const yyyy = day.getFullYear()
                            const mm = String(day.getMonth() + 1).padStart(2, '0')
                            const dd = String(day.getDate()).padStart(2, '0')
                            const val = `${yyyy}-${mm}-${dd}T${time}`
                            const isSelected = form.appointment_date === val
                            
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => selectTimeSlot(day, time)}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                                  isSelected 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'bg-slate-50 text-slate-600 border border-slate-100 hover:border-blue-200 hover:text-blue-600'
                                }`}
                              >
                                {time}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>



            <button 
              disabled={loading || !form.vehicle_id}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Submitting...' : 'Send Service Request'}
            </button>
          </form>
        </div>
      </div>
    </UserLayout>
  )
}
