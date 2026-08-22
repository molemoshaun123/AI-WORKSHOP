import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../../layouts/AppLayout'
import api from '../../../services/api'
import JobContextPanel from './JobContextPanel'


const MAX_DURATION_S = 15

export default function AudioDiagnostics() {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [rejected, setRejected] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop())
  }, [])

  const startRecording = async () => {
    try {
      setResult(null)
      setRejected(null)
      setAudioBlob(null)
      setAudioUrl(null)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start(250)
      setRecording(true)
      setElapsed(0)
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsed(s)
        if (s >= MAX_DURATION_S) {
          stopRecording()
        }
      }, 300)
    } catch (err) {
      toast.error('Microphone access denied. Please allow microphone permission or upload a file instead.')
    }
  }

  const stopRecording = () => {
    cleanup()
    setRecording(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file (mp3, wav, ogg, webm, etc.)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Please use a shorter clip (under 10MB).')
      return
    }
    setResult(null)
    setRejected(null)
    setAudioBlob(file)
    setAudioUrl(URL.createObjectURL(file))
  }

  const handleAnalyze = async () => {
    if (!audioBlob) return
    setLoading(true)
    setResult(null)
    setRejected(null)

    try {
      const reader = new FileReader()
      const base64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(audioBlob)
      })

      const mimeType = audioBlob.type || 'audio/webm'
      const res = await api.post('/ai/analyze-audio', {
        audioBase64: base64,
        mimeType,
      })

      if (res.data?.analysis) {
        setResult(res.data.analysis)
      }
    } catch (err) {
      if (err.response?.data?.rejected) {
        setRejected(err.response.data.message)
      } else {
        toast.error(err.response?.data?.message || 'Audio analysis failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const urgencyColors = {
    none: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    low: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
    medium: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    high: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
    critical: 'text-red-300 bg-red-500/10 border-red-500/20',
  }

  const healthColors = {
    healthy: 'from-emerald-500/20 to-green-600/20 border-emerald-500/20',
    minor_concern: 'from-amber-500/20 to-yellow-600/20 border-amber-500/20',
    needs_attention: 'from-orange-500/20 to-red-500/20 border-orange-500/20',
    urgent: 'from-red-500/20 to-rose-600/20 border-red-500/20',
  }

  const healthLabels = {
    healthy: '✅ Vehicle Sounds Healthy',
    minor_concern: '⚠️ Minor Concern Detected',
    needs_attention: '🔧 Needs Attention',
    urgent: '🚨 Urgent Issue Detected',
  }

  const healthTextColors = {
    healthy: 'text-emerald-300',
    minor_concern: 'text-amber-300',
    needs_attention: 'text-orange-300',
    urgent: 'text-red-300',
  }

  const isHealthy = result?.health_status === 'healthy'

  return (
    <AppLayout title="Audio Engine Diagnostics">
      <JobContextPanel />
      <div className="grid lg:grid-cols-12 gap-8">
        {/* ── Input Panel ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Record Audio */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
            <h3 className="text-xl font-black mb-2">Record Car Sound</h3>
            <p className="text-slate-400 text-sm font-semibold mb-6">
              Hold your phone near the engine bay, exhaust, or wheels while the car is running. Max {MAX_DURATION_S}s.
            </p>

            <div className="flex flex-col items-center gap-5">
              {/* Mic Button */}
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={loading}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                  recording
                    ? 'bg-red-500 shadow-red-500/30 hover:bg-red-600 scale-105'
                    : 'bg-gradient-to-br from-rose-500 to-orange-600 shadow-rose-500/20 hover:scale-105'
                } disabled:opacity-50`}
              >
                {recording && (
                  <span className="absolute inset-0 rounded-full border-4 border-red-400/50 animate-ping" />
                )}
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {recording ? (
                    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z M19 10v2a7 7 0 01-14 0v-2 M12 19v4m-4 0h8"
                    />
                  )}
                </svg>
              </button>

              {recording && (
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-300 font-black text-lg tabular-nums">
                    {elapsed}s / {MAX_DURATION_S}s
                  </span>
                </div>
              )}

              {!recording && (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {audioBlob ? 'Recording captured' : 'Tap to start recording'}
                </p>
              )}
            </div>

            {/* Audio playback */}
            {audioUrl && (
              <div className="mt-6 p-4 rounded-2xl bg-slate-950/40 border border-white/10">
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}
          </div>

          {/* Upload fallback */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
            <h3 className="text-lg font-black mb-2">Or Upload Audio File</h3>
            <p className="text-slate-400 text-sm font-semibold mb-5">
              Supports MP3, WAV, OGG, WebM, AAC
            </p>

            <label className="block cursor-pointer">
              <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-rose-500/30 transition-colors">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm font-bold text-slate-300">Click to browse audio files</span>
              </div>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !audioBlob}
            className="w-full bg-gradient-to-r from-rose-600 to-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-500/20 hover:scale-[1.01] transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Analyzing Audio...
              </span>
            ) : (
              'Analyze Sound'
            )}
          </button>
        </div>

        {/* ── Results Panel ── */}
        <div className="lg:col-span-7 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black">Diagnosis Results</h3>
            {result?.confidence_score != null && (
              <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                Confidence: {Math.round(result.confidence_score * 100)}%
              </div>
            )}
          </div>

          {rejected && (
            <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-200 font-semibold text-sm">
              {rejected}
            </div>
          )}

          {!result && !rejected ? (
            <div className="h-72 flex flex-col items-center justify-center text-slate-500 font-bold gap-4">
              <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v7.553m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66A2.25 2.25 0 005.25 13.5V9.053z" />
              </svg>
              Record or upload car audio to get a sound-based diagnosis.
            </div>
          ) : result && (
            <div className="space-y-6">
              {/* Health Status Banner */}
              {result.health_status && (
                <div className={`p-6 rounded-[2rem] bg-gradient-to-r border ${healthColors[result.health_status] || healthColors.minor_concern}`}>
                  <p className={`text-2xl font-black ${healthTextColors[result.health_status] || 'text-white'}`}>
                    {healthLabels[result.health_status] || result.health_status}
                  </p>
                  {result.health_summary && (
                    <p className="text-slate-200 font-semibold text-sm mt-2 leading-relaxed">{result.health_summary}</p>
                  )}
                </div>
              )}

              {/* Detected Sounds */}
              {result.detected_sounds?.length > 0 && (
                <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Detected Sounds</p>
                  <div className="flex flex-wrap gap-2">
                    {result.detected_sounds.map((s, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold ${
                          isHealthy
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Predicted Problem / Verdict */}
              <div className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  {isHealthy ? 'Verdict' : 'Predicted Problem'}
                </p>
                <p className="text-white font-black text-lg">{result.predicted_problem}</p>
                {result.urgency && (
                  <span className={`mt-3 inline-block px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${urgencyColors[result.urgency] || urgencyColors.medium}`}>
                    {result.urgency === 'none' ? 'No urgency' : `Urgency: ${result.urgency}`}
                  </span>
                )}
              </div>

              {/* Probable Causes */}
              {result.probable_causes?.length > 0 && (
                <div className="grid gap-4">
                  {result.probable_causes.map((c, idx) => (
                    <div key={idx} className="p-6 rounded-[2rem] bg-slate-950/30 border border-white/5">
                      <div className="flex justify-between items-start gap-6">
                        <div>
                          <p className="text-white font-black">{c.cause}</p>
                          {c.explanation && (
                            <p className="text-slate-300/80 font-semibold text-sm mt-2">{c.explanation}</p>
                          )}
                        </div>
                        {c.probability_percent != null && (
                          <div className={`shrink-0 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                            isHealthy
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                          }`}>
                            {c.probability_percent}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Action */}
              {result.recommended_action && (
                <div className={`p-6 rounded-[2rem] border ${
                  isHealthy
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-blue-500/10 border-blue-500/20'
                }`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isHealthy ? 'text-emerald-300' : 'text-blue-300'}`}>
                    Recommended Action
                  </p>
                  <p className="text-slate-200 font-semibold text-sm leading-relaxed">{result.recommended_action}</p>
                </div>
              )}

              {/* Safety Warning */}
              {result.safety_warning && (
                <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-300 mb-2">⚠️ Safety Warning</p>
                  <p className="text-red-200 font-semibold text-sm leading-relaxed">{result.safety_warning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
