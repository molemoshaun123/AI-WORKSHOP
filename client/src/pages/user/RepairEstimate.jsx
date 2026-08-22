import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import UserLayout from '../../layouts/UserLayout'
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
    <UserLayout title="Repair Time Estimation">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          <h3 className="text-xl font-black mb-6 text-slate-900">Request Estimate</h3>
          <div className="space-y-4">
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.5rem] bg-[right_1rem_center] bg-no-repeat"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-5 py-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none transition-all"
            />
            <button
              onClick={runEstimate}
              disabled={loading || !symptoms.trim() || !vehicleId}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-sm hover:bg-blue-700 hover:scale-[1.01] transition-all disabled:opacity-60"
            >
              {loading ? 'Estimating...' : 'Get Estimate'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-900">Estimate</h3>
            {estimate && (
              <div className="px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-[10px] font-black uppercase tracking-widest text-blue-700">
                Ready
              </div>
            )}
          </div>

          {!estimate ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 font-bold bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              Enter symptoms to generate a time estimate.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Estimated Hours</p>
                  <p className="text-3xl font-black text-slate-900">
                    {estimate.estimated_hours_min}–{estimate.estimated_hours_max}
                  </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Estimated Days</p>
                  <p className="text-3xl font-black text-slate-900">
                    {estimate.estimated_days_min}–{estimate.estimated_days_max}
                  </p>
                </div>
                {estimate.estimated_labor_cost_min !== undefined && (
                  <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Est. Labor Cost</p>
                    <p className="text-3xl font-black text-slate-900">
                      ${estimate.estimated_labor_cost_min}–${estimate.estimated_labor_cost_max}
                    </p>
                  </div>
                )}
                {estimate.estimated_parts_cost_min !== undefined && (
                  <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Est. Parts Cost</p>
                    <p className="text-3xl font-black text-slate-900">
                      ${estimate.estimated_parts_cost_min}–${estimate.estimated_parts_cost_max}
                    </p>
                  </div>
                )}
              </div>

              {estimate.scheduling_notes && (
                <div className="p-6 rounded-[2rem] bg-blue-50 border border-blue-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Scheduling Notes</p>
                  <p className="text-slate-700 font-semibold text-sm leading-relaxed">{estimate.scheduling_notes}</p>
                </div>
              )}
              {estimate.assumptions && (
                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Assumptions</p>
                  <p className="text-slate-600 font-semibold text-sm leading-relaxed">{estimate.assumptions}</p>
                </div>
              )}

              <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Book Service</p>
                <div className="grid sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Preferred date</label>
                    <input
                      type="datetime-local"
                      value={appointment}
                      onChange={(e) => setAppointment(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <button
                    onClick={bookService}
                    disabled={booking}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm font-black py-4 rounded-2xl transition-all disabled:opacity-60"
                  >
                    {booking ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
