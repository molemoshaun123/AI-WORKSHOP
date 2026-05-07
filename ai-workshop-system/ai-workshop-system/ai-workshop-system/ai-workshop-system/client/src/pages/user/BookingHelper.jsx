import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function BookingHelper({ vehicles }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        'Tell me what you need and I will guide you to the best booking option (estimate or direct booking).',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const vehicleSummary = useMemo(() => {
    return (vehicles || []).map((v) => ({
      vehicle_id: v.vehicle_id,
      make: v.make,
      model: v.model,
      year: v.year,
      registration_number: v.registration_number,
    }))
  }, [vehicles])

  const send = async (text) => {
    const value = String(text || '').trim()
    if (!value) return

    setMessages((prev) => [...prev, { role: 'user', text: value }])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post('/ai/booking-helper', {
        message: value,
        vehicles: vehicleSummary,
        now: new Date().toISOString(),
      })

      let data = res.data?.result
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())

      try {
        sessionStorage.setItem('booking_helper_prefill', JSON.stringify(data || {}))
      } catch {}

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data?.reply || 'Open Repair Estimate to continue booking.',
        },
      ])

      if (data?.suggested_route === '/user/estimate') {
        setTimeout(() => navigate('/user/estimate'), 400)
      }
      if (data?.suggested_route === '/user/service') {
        setTimeout(() => navigate('/user/service'), 400)
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'I could not generate a suggestion. Please use Repair Estimate to book.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
      <div className="p-8 border-b border-white/5 flex justify-between items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black mb-2">Booking Helper</p>
          <h3 className="text-xl font-black tracking-tight">Service Booking Assistant</h3>
          <p className="text-slate-400 text-sm font-semibold">Strictly helps you book a service.</p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-widest">
          Helper
        </div>
      </div>

      <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-5 py-4 rounded-[1.75rem] text-sm font-semibold leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-400 text-slate-950 rounded-tr-none'
                  : 'bg-slate-950/40 border border-white/5 text-slate-200 rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-2">
        <div className="flex flex-wrap gap-2">
          {[
            'I want to book a service',
            'My car is making noise',
            'Brake pads replacement',
            'Oil change',
          ].map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => send(q)}
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-60"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-white/5 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your service request..."
          className="flex-1 bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          disabled={loading || !input.trim()}
          onClick={() => send(input)}
          className="px-6 rounded-2xl bg-cyan-400 text-slate-950 font-black hover:bg-cyan-300 transition-all disabled:opacity-60"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
