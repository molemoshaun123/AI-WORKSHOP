import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange, dark = true }) {
  if (totalPages <= 1) return null

  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages, start + maxVisible - 1)
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  const btnBase = dark
    ? 'border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30'
    : 'border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30'

  const activeBtn = dark
    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
    : 'bg-blue-50 border-blue-200 text-blue-700'

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`h-10 w-10 rounded-xl border flex items-center justify-center transition ${btnBase}`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className={`h-10 w-10 rounded-xl border flex items-center justify-center text-sm font-bold transition ${btnBase}`}
          >
            1
          </button>
          {start > 2 && <span className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`h-10 w-10 rounded-xl border flex items-center justify-center text-sm font-bold transition ${
            p === currentPage ? activeBtn : btnBase
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>…</span>}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className={`h-10 w-10 rounded-xl border flex items-center justify-center text-sm font-bold transition ${btnBase}`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`h-10 w-10 rounded-xl border flex items-center justify-center transition ${btnBase}`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
