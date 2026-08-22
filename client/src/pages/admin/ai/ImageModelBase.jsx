import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../../services/api'

export default function ImageModelBase({ title, subtitle, type, accent, renderResult }) {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [rejectionMessage, setRejectionMessage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [compressedPreviewUrl, setCompressedPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e) => {
    const next = e.target.files?.[0] || null
    setFile(next)
    setResult(null)
    setRejectionMessage(null)
    setCompressedPreviewUrl(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (next) setPreviewUrl(URL.createObjectURL(next))
    else setPreviewUrl(null)
  }

  const compressToJpegDataUrl = (img, maxSize = 650, quality = 0.7) => {
    const canvas = document.createElement('canvas')
    const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
    const width = Math.round(img.width * ratio)
    const height = Math.round(img.height * ratio)
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  }

  const sendImage = async (imageDataUrl, mimeType) => {
    const res = await api.post('/images', {
      image: imageDataUrl,
      mimeType: mimeType || 'image/jpeg',
      type,
    })
    return res.data.analysis
  }

  const handleRun = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    setRejectionMessage(null)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        let base64 = reader.result
        let mimeType = file.type || ''

        try {
          const img = new Image()
          img.onload = async () => {
            try {
              // Always compress to a reasonable JPEG size before sending
              const compressed = compressToJpegDataUrl(img)
              setCompressedPreviewUrl(compressed)
              mimeType = 'image/jpeg'
              const analysis = await sendImage(compressed, mimeType)
              setResult(analysis)
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
                toast.error(data?.message || data?.error || 'Analysis failed', { duration: 5000 })
              }
            } finally {
              setLoading(false)
            }
          }
          img.onerror = async () => {
            try {
              const analysis = await sendImage(base64, mimeType || 'image/jpeg')
              setResult(analysis)
            } catch (err) {
              console.error('Image analysis error (fallback):', err)
              const data = err?.response?.data
              if (data?.rejected) {
                setRejectionMessage(data.rejection_reason || 'Image not suitable for this model')
              } else {
                toast.error(data?.message || data?.error || 'Analysis failed', { duration: 5000 })
              }
            } finally {
              setLoading(false)
            }
          }
          img.src = base64
        } catch {
          try {
            const analysis = await sendImage(base64, mimeType || 'image/jpeg')
            setResult(analysis)
          } catch (err) {
            console.error('Image analysis error (raw):', err)
            const data = err?.response?.data
            if (data?.rejected) {
              setRejectionMessage(data.rejection_reason || 'Image not suitable for this model')
            } else {
              toast.error(data?.message || data?.error || 'Analysis failed', { duration: 5000 })
            }
          } finally {
            setLoading(false)
          }
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setLoading(false)
      toast.error(err.response?.data?.message || 'Analysis failed')
    }
  }

  const previewToShow = compressedPreviewUrl || previewUrl

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
        <div className={`h-2 w-full rounded-full bg-gradient-to-r ${accent} border border-white/5 mb-6`}></div>
        <h3 className="text-2xl font-black tracking-tight mb-2">{title}</h3>
        <p className="text-slate-300/70 font-semibold mb-8">{subtitle}</p>

        <form onSubmit={handleRun} className="space-y-5">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload image</p>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full bg-slate-950/40 border-2 border-dashed border-white/10 p-8 rounded-[2rem] text-sm text-slate-400 file:hidden cursor-pointer hover:border-cyan-500/50 transition-all text-center"
            />
          </div>
          <button
            disabled={loading || !file}
            className="w-full bg-cyan-400 text-slate-950 font-black py-4 rounded-2xl hover:bg-cyan-300 transition-all disabled:opacity-60"
          >
            {loading ? 'Analyzing...' : 'Run Model'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
        <h3 className="text-xl font-black mb-6">Result</h3>
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 overflow-hidden">
            {!previewToShow ? (
              <div className="h-40 flex items-center justify-center text-slate-500 font-bold">Preview will appear here.</div>
            ) : (
              <img src={previewToShow} alt="Uploaded preview" className="w-full h-40 object-cover" />
            )}
          </div>

          {rejectionMessage ? (
            <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-center space-y-3">
              <div className="h-14 w-14 mx-auto bg-red-500/15 rounded-full flex items-center justify-center text-2xl border border-red-500/20">🚫</div>
              <p className="text-red-400 font-black text-sm uppercase tracking-widest">Image Rejected</p>
              <p className="text-slate-200 font-semibold text-sm leading-relaxed">{rejectionMessage}</p>
            </div>
          ) : !result ? (
            <div className="h-32 flex items-center justify-center text-slate-500 font-bold">Upload an image to see results.</div>
          ) : (
            renderResult(result)
          )}
        </div>
      </div>
    </div>
  )
}
