import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Send } from 'lucide-react'
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
    <div className="bg-slate-900/60 rounded-[2rem] border border-white/10 shadow-xl shadow-black/20 overflow-hidden flex flex-col h-full backdrop-blur-xl">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-black">AI Workshop Assistant</span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">Service Assistant</h3>
          <p className="text-slate-400 text-xs font-semibold">AI-guided booking & diagnostics</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          AI Active
        </div>
      </div>

      <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto bg-slate-950/40 flex-1 [scrollbar-width:thin]">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none shadow-blue-500/20'
                  : 'bg-slate-800/90 border border-white/10 text-slate-200 rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-3 pt-2 bg-slate-950/40 border-t border-white/5">
        <div className="flex flex-wrap gap-1.5">
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
              className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 text-[10px] font-bold tracking-tight hover:bg-slate-700 hover:border-cyan-400/30 hover:text-cyan-300 transition-all disabled:opacity-60 shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/5 flex gap-2.5 bg-slate-900/60">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your service request to AI..."
          className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
        />
        <button
          disabled={loading || !input.trim()}
          onClick={() => send(input)}
          className="px-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 transition-all disabled:opacity-60 shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
        >
          {loading ? '...' : (
            <>
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
