import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'Search...', debounceMs = 300, className = '', dark = true }) {
  const [local, setLocal] = useState(value || '')
  const timerRef = useRef(null)

  useEffect(() => {
    setLocal(value || '')
  }, [value])

  const handleChange = (e) => {
    const v = e.target.value
    setLocal(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), debounceMs)
  }

  const clear = () => {
    setLocal('')
    onChange('')
  }

  const base = dark
    ? 'bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:ring-cyan-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500'

  return (
    <div className={`relative ${className}`}>
      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full rounded-2xl border pl-11 pr-10 py-3 text-sm font-bold outline-none focus:ring-2 transition-all ${base}`}
      />
      {local && (
        <button
          type="button"
          onClick={clear}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition ${dark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
