import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

export default function RepairEstimate() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [vehicles, setVehicles] = useState([])
  const [vehicleId, setVehicleId] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [appointment, setAppointment] = useState('')
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const res = await api.get(`/vehicles/user/${user.user_id}`)
        setVehicles(res.data)
        if (res.data.length > 0) setVehicleId(res.data[0].vehicle_id)
      } catch (e) {
        setVehicles([])
      }
    }
    if (user) loadVehicles()
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('booking_helper_prefill')
      if (!raw) return
      const data = JSON.parse(raw)
      sessionStorage.removeItem('booking_helper_prefill')
      if (data?.draft_symptoms && !symptoms) setSymptoms(String(data.draft_symptoms))
      if (data?.draft_appointment_date_iso && !appointment) {
        const d = new Date(data.draft_appointment_date_iso)
        if (!Number.isNaN(d.getTime())) {
          const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
          setAppointment(iso)
        }
      }
    } catch {}
  }, [])

  const runEstimate = async () => {
    setLoading(true)
    try {
      const selected = vehicles.find((v) => v.vehicle_id === vehicleId) || {}
      const res = await api.post('/ai/repair-time-estimate', {
        symptoms,
        vehicleDetails: {
          make: selected.make,
          model: selected.model,
          year: selected.year,
          mileage: selected.mileage,
        },
      })
      let data = res.data?.estimate
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setEstimate(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Estimation failed')
    } finally {
      setLoading(false)
    }
  }

  const bookService = async () => {
    if (!appointment) return toast.error('Select an appointment date')
    if (!vehicleId) return toast.error('Register a vehicle first')
    setBooking(true)
    try {
      const hoursMin = Number(estimate?.estimated_hours_min ?? null)
      const hoursMax = Number(estimate?.estimated_hours_max ?? null)
      const daysMin = Number(estimate?.estimated_days_min ?? null)
      const daysMax = Number(estimate?.estimated_days_max ?? null)
      const estimated_hours = hoursMin != null && hoursMax != null ? (hoursMin + hoursMax) / 2 : null
      const estimated_days = daysMin != null && daysMax != null ? (daysMin + daysMax) / 2 : null

      await api.post('/jobs', {
        user_id: user.user_id,
        vehicle_id: vehicleId,
        title: 'Booked Service',
        symptoms,
        priority: 'normal',
        appointment_date: appointment,
        estimated_hours,
        estimated_days,
      })
      toast.success('Service booked successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  return (
    <AppLayout title="Repair Time Estimation">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
          <h3 className="text-xl font-black mb-6">Request Estimate</h3>
          <div className="space-y-4">
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {vehicles.map((v) => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.make} {v.model} ({v.registration_number})
                </option>
              ))}
            </select>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe the symptoms or service requested..."
              className="w-full bg-slate-950/40 border border-white/10 rounded-[2rem] px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-500 h-40 resize-none"
            />
            <button
              onClick={runEstimate}
              disabled={loading || !symptoms.trim() || !vehicleId}
              className="w-full bg-cyan-400 text-slate-950 font-black py-4 rounded-2xl hover:bg-cyan-300 transition-all disabled:opacity-60"
            >
              {loading ? 'Estimating...' : 'Get Estimate'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black">Estimate</h3>
            {estimate && (
              <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                Ready
              </div>
            )}
          </div>

          {!estimate ? (
            <div className="h-64 flex items-center justify-center text-slate-500 font-bold">
              Enter symptoms to generate a time estimate.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Estimated Hours</p>
                  <p className="text-3xl font-black">
                    {estimate.estimated_hours_min}–{estimate.estimated_hours_max}
                  </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Estimated Days</p>
                  <p className="text-3xl font-black">
                    {estimate.estimated_days_min}–{estimate.estimated_days_max}
                  </p>
                </div>
              </div>

              {estimate.scheduling_notes && (
                <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">Scheduling Notes</p>
                  <p className="text-slate-200 font-semibold text-sm leading-relaxed">{estimate.scheduling_notes}</p>
                </div>
              )}

              <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Book Service</p>
                <div className="grid sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Preferred date</label>
                    <input
                      type="datetime-local"
                      value={appointment}
                      onChange={(e) => setAppointment(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={bookService}
                    disabled={booking}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-60"
                  >
                    {booking ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
