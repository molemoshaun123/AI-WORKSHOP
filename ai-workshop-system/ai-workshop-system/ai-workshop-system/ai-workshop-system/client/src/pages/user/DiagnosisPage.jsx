import { useMemo, useRef, useState } from 'react'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value.replace(/```json|```/g, '').trim())
  } catch {
    return value
  }
}

export default function DiagnosisPage() {
  const [vehicle, setVehicle] = useState({ make: '', model: '', year: '', mileage: '' })
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Describe what is happening with your vehicle, including the symptoms, when it happens, and any warning lights. I will keep the advice car-focused and practical.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  const vehicleDetails = useMemo(
    () => ({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
    }),
    [vehicle]
  )

  const send = async (text) => {
    const trimmed = String(text || '').trim()
    if (!trimmed || loading) return

    const nextMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/ai/car-chat', { messages: nextMessages, vehicleDetails })
      const parsed = parseMaybeJson(res.data?.result)

      const reply =
        parsed && typeof parsed === 'object'
          ? parsed.reply || 'I can help with your vehicle. Please share more details.'
          : 'I can help with your vehicle. Please share more details.'

      const followUps = parsed && typeof parsed === 'object' ? parsed.follow_up_questions || [] : []

      setMessages([...nextMessages, { role: 'assistant', content: reply, followUps }])
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: err.response?.data?.message || 'Request failed. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <AppLayout title="Vehicle Assistant">
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-7 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Vehicle context</p>
            <h3 className="mt-2 text-xl font-black text-white">Optional Details</h3>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              Adding vehicle details improves the quality of the assistant response.
            </p>
          </div>

          <div className="space-y-4">
            <input value={vehicle.make} onChange={(e) => setVehicle((p) => ({ ...p, make: e.target.value }))} placeholder="Make" className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500" />
            <input value={vehicle.model} onChange={(e) => setVehicle((p) => ({ ...p, model: e.target.value }))} placeholder="Model" className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500" />
            <input value={vehicle.year} onChange={(e) => setVehicle((p) => ({ ...p, year: e.target.value }))} placeholder="Year" className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500" />
            <input value={vehicle.mileage} onChange={(e) => setVehicle((p) => ({ ...p, mileage: e.target.value }))} placeholder="Mileage" className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-cyan-500/20 bg-cyan-500/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Tip</p>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-100">
              Include what changed recently, when the problem happens, and whether the vehicle still feels safe to drive.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-7 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Conversation</p>
              <h3 className="mt-2 text-xl font-black text-white">Ask the Vehicle Assistant</h3>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
              Car only
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-auto rounded-[2rem] border border-white/10 bg-slate-950/30 p-5">
            {messages.map((m, idx) => (
              <div key={`${idx}-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-[1.5rem] border px-4 py-3 ${
                    m.role === 'user'
                      ? 'border-cyan-400/30 bg-cyan-500/15'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm font-semibold leading-7 text-white">{m.content}</p>

                  {m.role === 'assistant' && Array.isArray(m.followUps) && m.followUps.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.followUps.slice(0, 3).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => send(q)}
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-black text-slate-200 transition hover:bg-white/10"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="mt-5 flex gap-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="h-14 flex-1 resize-none rounded-[2rem] border border-white/10 bg-slate-950/40 px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-[2rem] bg-cyan-400 px-6 font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
