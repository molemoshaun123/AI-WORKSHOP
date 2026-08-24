import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function BookingHelper({ vehicles }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        'Tell me what you need and I will guide you to the best booking option.',
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
          text: data?.reply || 'Head to Book Service to continue.',
        },
      ])

      if (data?.suggested_route === '/user/estimate') {
        setTimeout(() => navigate('/user/service'), 400)
      }
      if (data?.suggested_route === '/user/service') {
        setTimeout(() => navigate('/user/service'), 400)
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'I could not generate a suggestion. Please use Book Service to continue.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black mb-2">Booking Helper</p>
          <h3 className="text-xl font-black tracking-tight text-slate-900">Service Assistant</h3>
          <p className="text-slate-500 text-sm font-semibold">Strictly helps you book a service.</p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-widest">
          AI Helper
        </div>
      </div>

      <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto bg-slate-50/50 flex-1">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-5 py-4 rounded-[1.75rem] text-sm font-semibold leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-4 pt-2 bg-slate-50/50">
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
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-60 shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 flex gap-3 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your service request..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          disabled={loading || !input.trim()}
          onClick={() => send(input)}
          className="px-6 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all disabled:opacity-60 shadow-md shadow-blue-500/20"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
