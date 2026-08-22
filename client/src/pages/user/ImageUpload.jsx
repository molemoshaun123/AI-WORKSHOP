import { useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

export default function ImageUpload() {
  const [file, setFile] = useState(null)
  const [type, setType] = useState('damage')
  const [result, setResult] = useState(null)
  const [rejectionMessage, setRejectionMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')

    setLoading(true)
    setResult(null)
    setRejectionMessage(null)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        try {
          const base64data = reader.result
          const res = await api.post('/images', {
            image: base64data,
            mimeType: file.type,
            type: type,
          })
          setResult(res.data.analysis)
        } catch (err) {
          console.error('Image analysis error:', err)
          const data = err?.response?.data
          if (data?.rejected) {
            setRejectionMessage(data.rejection_reason || 'Image not suitable for this model')
          } else if (err?.code === 'ECONNABORTED') {
            toast.error('Request timed out. Try a smaller image or try again.', { duration: 6000 })
          } else if (!err?.response) {
            toast.error('Cannot connect to server. Make sure the server is running.', { duration: 6000 })
          } else {
            toast.error(data?.message || data?.error || 'Upload failed', { duration: 5000 })
          }
        } finally {
          setLoading(false)
        }
      }
    } catch (err) {
      toast.error('Upload failed')
      setLoading(false)
    }
  }

  const renderTireResult = (data) => (
    <div className="space-y-4">
      {/* Condition Badge */}
      <div className={`p-4 rounded-2xl text-center font-black uppercase tracking-widest text-sm ${
        data.condition === 'replace'
          ? 'bg-red-500/10 border border-red-500/20 text-red-400'
          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
      }`}>
        {data.condition === 'replace' ? '⚠️ REPLACE NEEDED' : '✅ TIRE IS FINE'}
      </div>

      {/* Urgency indicator */}
      {data.urgency && data.urgency !== 'none' && (
        <div className={`p-3 rounded-xl text-center text-xs font-bold uppercase tracking-widest ${
          data.urgency === 'immediate'
            ? 'bg-red-600/20 text-red-300 border border-red-500/30'
            : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
        }`}>
          {data.urgency === 'immediate' ? '🚨 Urgency: IMMEDIATE' : '⏳ Urgency: REPLACE SOON'}
        </div>
      )}

      {/* Lifespan Estimates */}
      <div className="grid grid-cols-2 gap-3">
        {data.estimated_remaining_life_years != null && (
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/5 text-center">
            <div className="text-2xl font-black text-orange-400">{data.estimated_remaining_life_years}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Years Remaining</div>
          </div>
        )}
        {data.estimated_remaining_km != null && (
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/5 text-center">
            <div className="text-2xl font-black text-blue-400">{Number(data.estimated_remaining_km).toLocaleString()}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">KM Remaining</div>
          </div>
        )}
      </div>

      {/* Recommendation */}
      {data.recommendation && (
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Recommendation</div>
          <p className="text-sm text-slate-200 leading-relaxed">{data.recommendation}</p>
        </div>
      )}

      {/* Reason / Evidence */}
      {data.reason && (
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Evidence</div>
          <p className="text-sm text-slate-300 leading-relaxed">{data.reason}</p>
        </div>
      )}

      {/* Confidence */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-white/5">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confidence</div>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all" style={{ width: `${(data.confidence_score || 0) * 100}%` }} />
        </div>
        <div className="text-xs font-bold text-orange-400">{Math.round((data.confidence_score || 0) * 100)}%</div>
      </div>
    </div>
  )

  const renderDamageResult = (data) => (
    <div className="space-y-4">
      <div className={`p-4 rounded-2xl text-center font-black uppercase tracking-widest text-sm ${
        data.decision === 'replace'
          ? 'bg-red-500/10 border border-red-500/20 text-red-400'
          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
      }`}>
        {data.decision === 'replace' ? '🔧 REPLACE PART' : '🛠️ REPAIR PART'}
      </div>

      <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Part Identified</div>
        <p className="text-lg font-bold text-white">{data.part}</p>
      </div>

      {data.reason && (
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Reason</div>
          <p className="text-sm text-slate-300 leading-relaxed">{data.reason}</p>
        </div>
      )}

      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-white/5">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confidence</div>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all" style={{ width: `${(data.confidence_score || 0) * 100}%` }} />
        </div>
        <div className="text-xs font-bold text-orange-400">{Math.round((data.confidence_score || 0) * 100)}%</div>
      </div>
    </div>
  )

  const renderColorResult = (data) => (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center">
        <div className="text-2xl font-black text-white mb-1">{data.color_name}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Identified Colour</div>
      </div>

      {data.mix_suggestion && data.mix_suggestion.length > 0 && (
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Paint Mix Formula</div>
          <div className="space-y-2">
            {data.mix_suggestion.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" style={{ width: `${m.ratio_percent}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-300 min-w-[40px] text-right">{m.ratio_percent}%</span>
                <span className="text-xs text-slate-400">{m.component}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.notes && (
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Notes</div>
          <p className="text-sm text-slate-300 leading-relaxed">{data.notes}</p>
        </div>
      )}

      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-white/5">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confidence</div>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all" style={{ width: `${(data.confidence_score || 0) * 100}%` }} />
        </div>
        <div className="text-xs font-bold text-orange-400">{Math.round((data.confidence_score || 0) * 100)}%</div>
      </div>
    </div>
  )

  const renderResult = (data) => {
    if (type === 'tire') return renderTireResult(data)
    if (type === 'damage') return renderDamageResult(data)
    if (type === 'color') return renderColorResult(data)
    // Fallback: raw JSON
    return (
      <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5">
        <pre className="text-orange-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <AppLayout title="Vehicle Photo Analysis">
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <span className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm">📸</span>
              Upload Asset
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Analysis Model</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                >
                  <option value="damage">🛠️ Damage Analysis</option>
                  <option value="color">🎨 Colour Recognition</option>
                  <option value="tire">🛞 Tire Condition Check</option>
                </select>
              </div>

              {/* Model scope hint */}
              <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">
                {type === 'color' && '🎨 Upload a photo for colour identification'}
                {type === 'damage' && '🛠️ Upload a photo of a car part for damage assessment'}
                {type === 'tire' && '🛞 Upload a photo of a tire for condition check'}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Select Image</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    className="w-full bg-slate-800/50 border-2 border-dashed border-white/10 p-8 rounded-[2rem] text-sm text-slate-400 file:hidden cursor-pointer hover:border-orange-500/50 transition-all text-center" 
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:scale-105 transition-transform">
                    {file ? (
                      <p className="text-orange-400 font-bold">{file.name}</p>
                    ) : (
                      <>
                        <span className="text-3xl mb-2">📁</span>
                        <p className="font-bold">Drop your image here</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Run Analysis'}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-6xl font-black">Analysis</div>
          <h3 className="text-xl font-black mb-6 flex items-center gap-3">
            <span className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm">🔎</span>
            Analysis Results
          </h3>
          
          {rejectionMessage ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="h-16 w-16 bg-red-500/15 rounded-full flex items-center justify-center text-3xl border border-red-500/20">🚫</div>
              <p className="text-red-400 font-black text-sm uppercase tracking-widest">Image Rejected</p>
              <p className="text-slate-300 font-semibold text-sm max-w-[320px] leading-relaxed">{rejectionMessage}</p>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              {renderResult(result)}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest text-center">
                Analysis Complete • Model Output Ready
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4 border border-white/5 animate-pulse">
                ⌛
              </div>
              <p className="text-slate-500 font-bold text-sm max-w-[200px]">Upload a vehicle image to see the analysis output.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
