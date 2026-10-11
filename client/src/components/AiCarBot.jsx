import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, Car } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value.replace(/```json|```/g, '').trim())
  } catch {
    return value
  }
}

export default function AiCarBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your Auto Tune car assistant. Ask me anything about cars — diagnostics, maintenance tips, warning lights, or repair advice. 🚗',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pulse, setPulse] = useState(true)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  // Stop pulsing once opened
  useEffect(() => {
    if (open) {
      setPulse(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  // Auto-scroll to bottom
  useEffect(() => {
    if (open && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const send = useCallback(async (text) => {
    const trimmed = String(text || '').trim()
    if (!trimmed || loading) return

    const nextMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/ai/car-chat', {
        messages: nextMessages,
        vehicleDetails: {},
      })
      const parsed = parseMaybeJson(res.data?.result)

      const reply =
        parsed && typeof parsed === 'object'
          ? parsed.reply || 'I can only help with car-related questions. Please describe a vehicle issue.'
          : typeof parsed === 'string'
          ? parsed
          : 'I can only help with car-related questions. Please describe a vehicle issue.'

      const followUps =
        parsed && typeof parsed === 'object' ? parsed.follow_up_questions || [] : []

      setMessages([...nextMessages, { role: 'assistant', content: reply, followUps }])
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content:
            err.response?.data?.message ||
            'Something went wrong. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-white font-black shadow-xl shadow-blue-500/25 border border-white/10 transition-all hover:scale-105 hover:shadow-blue-500/40 active:scale-95"
            aria-label="Open AI Car Assistant"
          >
            {pulse && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-400"></span>
              </span>
            )}
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span className="text-xs sm:text-sm font-bold tracking-tight">Ask AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-6 right-4 sm:right-6 md:bottom-8 md:right-8 z-50 w-[calc(100vw-2rem)] sm:w-96 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col overflow-hidden max-h-[80vh]"
            style={{ height: 'min(520px, calc(100vh - 6rem))' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Auto Tune AI</h3>
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Car questions only</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/80 [scrollbar-width:thin]">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-md'
                        : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
                      {m.content}
                    </p>

                    {/* Follow-up suggestions */}
                    {m.role === 'assistant' && Array.isArray(m.followUps) && m.followUps.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {m.followUps.slice(0, 3).map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => send(q)}
                            className="rounded-xl border border-white/10 bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span className="text-xs font-bold text-slate-300">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/10 bg-slate-900 p-3 shrink-0">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about cars..."
                  className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">
                Only answers car-related questions
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
