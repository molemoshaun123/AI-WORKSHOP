import { useEffect, useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import UserLayout from '../../layouts/UserLayout'
import api from '../../services/api'
import { Camera, ChevronRight, ChevronLeft, Upload, X, TrendingUp, TrendingDown, DollarSign, Star, Car, Gauge, FileText, Sparkles } from 'lucide-react'

const STEPS = ['Vehicle Details', 'Condition & Mileage', 'Upload Photos', 'Valuation']

const CONDITIONS = [
  { value: 'Excellent', label: 'Excellent', emoji: '✨', desc: 'Like new, no visible wear' },
  { value: 'Good', label: 'Good', emoji: '👍', desc: 'Minor wear, well maintained' },
  { value: 'Fair', label: 'Fair', emoji: '👌', desc: 'Some cosmetic issues' },
  { value: 'Poor', label: 'Poor', emoji: '⚠️', desc: 'Significant wear or damage' },
]

const SERVICE_HISTORY = [
  { value: 'Full', label: 'Full Service History' },
  { value: 'Partial', label: 'Partial History' },
  { value: 'None', label: 'No History' },
]

const TRANSMISSIONS = ['Manual', 'Automatic', 'CVT', 'DCT']
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric']
const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape']

const PHOTO_SLOTS = [
  { key: 'exterior', label: 'Exterior', emoji: '🚗' },
  { key: 'interior', label: 'Interior', emoji: '🪑' },
  { key: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { key: 'engine', label: 'Engine Bay', emoji: '⚙️' },
]

function formatZAR(val) {
  if (val == null || isNaN(val)) return 'R 0'
  return 'R ' + Number(val).toLocaleString('en-ZA')
}

export default function CarValuator() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [vehicles, setVehicles] = useState([])
  const [vehicleId, setVehicleId] = useState('')
  const [manualEntry, setManualEntry] = useState(false)
  const [loading, setLoading] = useState(false)
  const [valuation, setValuation] = useState(null)
  const [animateValue, setAnimateValue] = useState(false)

  const [form, setForm] = useState({
    make: '', model: '', year: '', color: '', original_price: '',
    mileage: '', condition: 'Good', service_history: 'Full',
    modifications: '', transmission: 'Manual', fuel_type: 'Petrol',
    province: 'Gauteng',
  })

  const [photos, setPhotos] = useState({
    exterior: null, interior: null, dashboard: null, engine: null,
  })

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const res = await api.get(`/vehicles/user/${user.user_id}`)
        setVehicles(res.data)
        if (res.data.length > 0) setVehicleId(res.data[0].vehicle_id)
      } catch {
        setVehicles([])
      }
    }
    if (user) loadVehicles()
  }, [])

  const handleVehicleSelect = (id) => {
    setVehicleId(id)
    setManualEntry(false)
    const v = vehicles.find((v) => v.vehicle_id === id)
    if (v) {
      setForm((f) => ({
        ...f,
        make: v.make || '', model: v.model || '', year: v.year || '',
        color: v.color || '', mileage: v.mileage || '',
      }))
    }
  }

  const handleManualToggle = () => {
    setManualEntry(true)
    setVehicleId('')
    setForm((f) => ({ ...f, make: '', model: '', year: '', color: '' }))
  }

  const handlePhotoChange = (slotKey, file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large (max 10MB)')
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      setPhotos((prev) => ({
        ...prev,
        [slotKey]: { data: reader.result, mimeType: file.type, name: file.name },
      }))
    }
  }

  const removePhoto = (slotKey) => {
    setPhotos((prev) => ({ ...prev, [slotKey]: null }))
  }

  const canProceed = () => {
    if (step === 0) return (form.make && form.model && form.year) || vehicleId
    if (step === 1) return form.mileage && form.condition
    return true
  }

  const runValuation = async () => {
    setLoading(true)
    setValuation(null)
    try {
      const images = Object.values(photos)
        .filter(Boolean)
        .map((p) => ({ data: p.data, mimeType: p.mimeType }))

      const res = await api.post('/ai/car-valuation', {
        vehicleDetails: {
          make: form.make,
          model: form.model,
          year: form.year,
          mileage: form.mileage,
          condition: form.condition,
          service_history: form.service_history,
          modifications: form.modifications,
          color: form.color,
          transmission: form.transmission,
          fuel_type: form.fuel_type,
          province: form.province,
          original_price: form.original_price,
        },
        images,
      })

      let data = res.data?.valuation
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setValuation(data)
      setStep(3)
      setTimeout(() => setAnimateValue(true), 300)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Valuation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step === 2) {
      runValuation()
    } else {
      setStep((s) => Math.min(s + 1, 3))
    }
  }

  const handleBack = () => {
    if (step === 3) {
      setAnimateValue(false)
    }
    setStep((s) => Math.max(s - 1, 0))
  }

  const resetAll = () => {
    setStep(0)
    setValuation(null)
    setAnimateValue(false)
    setPhotos({ exterior: null, interior: null, dashboard: null, engine: null })
  }

  // -- Drag & Drop handler --
  const handleDrop = useCallback((slotKey) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) handlePhotoChange(slotKey, file)
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // ======== RENDER STEPS ========

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-9 w-9 rounded-full text-xs font-black transition-all duration-500 ${
              i < step
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-90'
                : i === step
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            {i < step ? '✓' : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`hidden sm:block w-8 h-0.5 rounded-full transition-all duration-500 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep0 = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center mb-2">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Which vehicle do you want to value?</h3>
        <p className="text-slate-500 font-semibold text-sm mt-2">Select a registered vehicle or enter details manually.</p>
      </div>

      {vehicles.length > 0 && !manualEntry && (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <button
              key={v.vehicle_id}
              type="button"
              onClick={() => handleVehicleSelect(v.vehicle_id)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group ${
                vehicleId === v.vehicle_id
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                vehicleId === v.vehicle_id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'
              }`}>
                <Car className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-lg">{v.year} {v.make} {v.model}</p>
                <p className="text-slate-500 text-sm font-semibold">{v.registration_number} {v.color ? `• ${v.color}` : ''}</p>
              </div>
              {vehicleId === v.vehicle_id && (
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-black">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {vehicles.length > 0 && !manualEntry && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleManualToggle}
            className="text-blue-600 font-bold text-sm underline underline-offset-4 hover:text-blue-700 transition-colors"
          >
            Or enter details manually →
          </button>
        </div>
      )}

      {(manualEntry || vehicles.length === 0) && (
        <div className="space-y-4">
          {vehicles.length > 0 && (
            <button
              type="button"
              onClick={() => { setManualEntry(false); if (vehicles.length > 0) setVehicleId(vehicles[0].vehicle_id); handleVehicleSelect(vehicles[0].vehicle_id) }}
              className="text-blue-600 font-bold text-sm underline underline-offset-4 hover:text-blue-700 transition-colors"
            >
              ← Select a registered vehicle instead
            </button>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Make *</label>
              <input
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="e.g. Toyota"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Model *</label>
              <input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. Corolla"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Year *</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="e.g. 2020"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Color</label>
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="e.g. White"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Original Purchase Price (Optional)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={form.original_price}
                onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                placeholder="e.g. 250000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400">If left blank, AI will estimate the new retail price.</p>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center mb-2">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Condition & Details</h3>
        <p className="text-slate-500 font-semibold text-sm mt-2">Help us assess your vehicle's current state.</p>
      </div>

      {/* Mileage */}
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Mileage (km) *</label>
        <div className="relative">
          <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="number"
            value={form.mileage}
            onChange={(e) => setForm({ ...form, mileage: e.target.value })}
            placeholder="e.g. 85000"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overall Condition *</label>
        <div className="grid grid-cols-2 gap-3">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm({ ...form, condition: c.value })}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                form.condition === c.value
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{c.emoji}</span>
                <span className="font-black text-sm text-slate-900">{c.label}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Transmission & Fuel */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transmission</label>
          <select
            value={form.transmission}
            onChange={(e) => setForm({ ...form, transmission: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
          >
            {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fuel Type</label>
          <select
            value={form.fuel_type}
            onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
          >
            {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Service History */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service History</label>
        <div className="flex gap-3">
          {SERVICE_HISTORY.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm({ ...form, service_history: s.value })}
              className={`flex-1 py-3 rounded-xl border-2 text-xs font-black transition-all duration-300 ${
                form.service_history === s.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Province */}
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Province</label>
        <select
          value={form.province}
          onChange={(e) => setForm({ ...form, province: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
        >
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Modifications */}
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modifications (Optional)</label>
        <input
          value={form.modifications}
          onChange={(e) => setForm({ ...form, modifications: e.target.value })}
          placeholder="e.g. Aftermarket exhaust, lowered suspension..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>
    </div>
  )

  const renderStep2 = () => {
    const photoCount = Object.values(photos).filter(Boolean).length
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="text-center mb-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Upload Photos</h3>
          <p className="text-slate-500 font-semibold text-sm mt-2">Optional — photos help the AI assess visual condition for a more accurate valuation.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {PHOTO_SLOTS.map((slot) => (
            <div
              key={slot.key}
              onDrop={handleDrop(slot.key)}
              onDragOver={handleDragOver}
              className="relative group"
            >
              {photos[slot.key] ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md shadow-emerald-500/10">
                  <img
                    src={photos[slot.key].data}
                    alt={slot.label}
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white text-xs font-black uppercase tracking-widest">{slot.label}</div>
                  <button
                    type="button"
                    onClick={() => removePhoto(slot.key)}
                    className="absolute top-2 right-2 h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(slot.key, e.target.files?.[0])}
                    className="hidden"
                  />
                  <span className="text-2xl mb-1">{slot.emoji}</span>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{slot.label}</span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1">Tap or drag</span>
                </label>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
          <p className="text-xs font-bold text-blue-700">
            {photoCount === 0
              ? '📷 No photos added — valuation will be based on details only.'
              : `📸 ${photoCount} photo${photoCount > 1 ? 's' : ''} added — AI will analyze visual condition.`}
          </p>
        </div>
      </div>
    )
  }

  const renderStep3 = () => {
    if (!valuation) return null

    const fairValue = Number(valuation.fair_market_value || 0)
    const minValue = Number(valuation.estimated_value_min || 0)
    const maxValue = Number(valuation.estimated_value_max || 0)
    const tradeIn = Number(valuation.trade_in_value || 0)
    const privateSale = Number(valuation.private_sale_value || 0)
    const retailValue = Number(valuation.retail_value || 0)
    const originalPrice = Number(valuation.original_price || 0)
    const valueLost = Number(valuation.total_value_lost || 0)
    const depPercent = Number(valuation.depreciation_percentage || 0)
    const confidence = Math.round((valuation.confidence_score || 0) * 100)

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Cars.co.za style Header / Hero Value */}
        <div className={`relative overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 p-8 sm:p-10 text-white text-center shadow-2xl transition-all duration-700 ${animateValue ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="absolute top-0 right-0 p-4">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/30">
              <Star className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black">{confidence}% Confidence</span>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Market Value Report</p>
            <h2 className="text-2xl sm:text-3xl font-black mb-6">{form.year} {form.make} {form.model}</h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 mt-8 mb-4">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Original Price</p>
                <p className="text-2xl font-medium text-slate-300 line-through decoration-red-500/50">{formatZAR(originalPrice)}</p>
              </div>
              
              <div className="hidden sm:flex flex-col items-center justify-center text-red-400">
                <div className="h-px w-16 bg-red-500/30 absolute"></div>
                <div className="bg-slate-900 z-10 px-2 flex flex-col items-center">
                  <TrendingDown className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-black">{depPercent}% Drop</span>
                </div>
              </div>

              <div className="text-center transform scale-110">
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Current Value</p>
                <p className={`text-4xl sm:text-5xl font-black text-white tracking-tight transition-all duration-1000 ${animateValue ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                  {formatZAR(fairValue)}
                </p>
              </div>
            </div>

            <div className="inline-block mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
              <p className="text-sm font-bold text-red-400">Total Value Lost: {formatZAR(valueLost)}</p>
            </div>
          </div>
        </div>

        {/* Condition badge */}
        {valuation.condition_rating && (
          <div className={`p-4 rounded-2xl text-center font-black uppercase tracking-widest text-sm ${
            valuation.condition_rating === 'Excellent' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : valuation.condition_rating === 'Good' ? 'bg-blue-50 border border-blue-200 text-blue-700'
            : valuation.condition_rating === 'Fair' ? 'bg-amber-50 border border-amber-200 text-amber-700'
            : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            Overall Condition: {valuation.condition_rating}
          </div>
        )}

        {/* Market Selling Options */}
        <div className="space-y-4">
          <h4 className="font-black text-lg text-slate-900 px-1">Selling Options</h4>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Dealer Trade-in</p>
              <p className="text-2xl font-black text-slate-900">{formatZAR(tradeIn)}</p>
              <p className="text-xs font-semibold text-slate-500 mt-2">Fastest sale, lowest price. Dealers buy at a discount to make a margin.</p>
            </div>
            
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm relative overflow-hidden transform sm:-translate-y-2">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="absolute top-2 right-2">
                <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Recommended</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Private Sale</p>
              <p className="text-2xl font-black text-slate-900">{formatZAR(privateSale)}</p>
              <p className="text-xs font-semibold text-slate-600 mt-2">Selling it yourself. Takes longer but gets you a better return.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Dealer Retail Price</p>
              <p className="text-2xl font-black text-slate-900">{formatZAR(retailValue)}</p>
              <p className="text-xs font-semibold text-slate-500 mt-2">What a dealership would sell this car for on their showroom floor.</p>
            </div>
          </div>
        </div>

        {/* Depreciation Breakdown */}
        {valuation.depreciation_factors && valuation.depreciation_factors.length > 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h4 className="font-black text-lg text-slate-900 mb-1">Why did it lose value?</h4>
            <p className="text-xs font-semibold text-slate-500 mb-6">Breakdown of the {formatZAR(valueLost)} depreciation</p>
            
            <div className="space-y-4">
              {valuation.depreciation_factors.map((f, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900">{f.reason}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{f.explanation}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-black text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                      -{formatZAR(f.amount_lost_zar)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Value factors (Condition adjustments) */}
        {valuation.value_factors && valuation.value_factors.length > 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Specific Condition Adjustments</p>
            <div className="space-y-3">
              {valuation.value_factors.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    f.impact === 'positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                  }`}>
                    {f.impact === 'positive' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-sm text-slate-900">{f.factor}</p>
                      <span className={`text-xs font-black ${f.impact === 'positive' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {f.impact === 'positive' ? '+' : '-'}{formatZAR(f.amount_zar)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{f.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Photo observations */}
          {valuation.photo_observations && (
            <div className="p-6 rounded-2xl bg-violet-50 border border-violet-100">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-violet-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Photo Analysis</p>
              </div>
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">{valuation.photo_observations}</p>
            </div>
          )}

          {/* Market comparison */}
          {valuation.market_comparison && (
            <div className="p-6 rounded-2xl bg-sky-50 border border-sky-100">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-sky-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Market Insight</p>
              </div>
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">{valuation.market_comparison}</p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {valuation.recommendations && valuation.recommendations.length > 0 && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Tips to Maximize Value</p>
            </div>
            <div className="space-y-2">
              {valuation.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-slate-700">{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Valuation */}
        <button
          type="button"
          onClick={resetAll}
          className="w-full py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black hover:bg-slate-50 transition-all mt-8"
        >
          Value Another Vehicle
        </button>
      </div>
    )
  }

  return (
    <UserLayout title="Car Value Estimator">
      <div className="max-w-2xl mx-auto">
        {/* Header badge */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600">AI-Powered</p>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Vehicle Valuation</h2>
          </div>
        </div>

        {renderStepIndicator()}

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation */}
          {step < 3 && (
            <div className={`flex ${step === 0 ? 'justify-end' : 'justify-between'} mt-8 pt-6 border-t border-slate-100`}>
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 shadow-lg ${
                  step === 2
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40'
                    : 'bg-blue-600 text-white shadow-blue-500/20 hover:shadow-blue-500/40 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Analyzing...
                  </>
                ) : step === 2 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get Valuation
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs font-semibold text-slate-400 mt-6 px-4 leading-relaxed">
          Valuations are AI-generated estimates based on market data and are for informational purposes only.
          Actual selling price may vary based on market conditions, negotiation, and vehicle inspection.
        </p>
      </div>
    </UserLayout>
  )
}
