import { useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'

export default function ConversationSummarizer() {
  const [topic, setTopic] = useState('')
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const run = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const messages = transcript
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => ({
          message_id: idx + 1,
          content: line,
          created_at: new Date(Date.now() + idx * 1000).toISOString(),
        }))

      const res = await api.post('/ai/conversation-summary', {
        messages,
        context: { topic },
      })
      let data = res.data?.result
      if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/g, '').trim())
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conversation summary failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Conversation Summarizer">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 h-2 w-full rounded-full border border-white/5 bg-gradient-to-r from-sky-500/20 to-indigo-600/20"></div>
          <h3 className="text-2xl font-black tracking-tight text-white">Conversation Input</h3>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-400">
            Paste a workshop conversation and get the summary, actions, and suggested reply.
          </p>

          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Conversation topic (optional)" className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" />
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste one message per line..." className="mt-4 h-64 w-full resize-none rounded-[2rem] border border-white/10 bg-slate-950/40 px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-500" />

          <button
            type="button"
            onClick={run}
            disabled={loading || !transcript.trim()}
            className="mt-6 w-full rounded-2xl bg-sky-500 py-4 font-black text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
          >
            {loading ? 'Summarizing...' : 'Summarize Conversation'}
          </button>
        </div>

        <div className="lg:col-span-7 rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <h3 className="text-xl font-black text-white">Summary</h3>
          {!result ? (
            <div className="flex h-72 items-center justify-center text-slate-500 font-bold">
              Paste a conversation to generate a summary.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Summary</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-white">{result.summary || '-'}</p>
                <p className="mt-3 text-sm font-bold text-slate-400">
                  Sentiment: {result.customer_sentiment || '-'} | Urgency: {result.urgency || '-'}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Action Items</p>
                  <div className="mt-4 space-y-2">
                    {(result.action_items || []).map((item, idx) => (
                      <p key={idx} className="text-sm font-semibold text-slate-300">{`- ${item}`}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Promised Follow-Ups</p>
                  <div className="mt-4 space-y-2">
                    {(result.promised_followups || []).map((item, idx) => (
                      <p key={idx} className="text-sm font-semibold text-slate-300">{`- ${item}`}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-sky-500/20 bg-sky-500/10 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">Suggested Reply</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-100">{result.suggested_reply || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
