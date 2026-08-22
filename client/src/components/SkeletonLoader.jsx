export function SkeletonLine({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />
}

export function SkeletonCard({ lines = 3, dark = true }) {
  const bg = dark ? 'bg-slate-950/40 border-white/10' : 'bg-slate-50 border-slate-200'
  const lineBg = dark ? 'bg-white/10' : 'bg-slate-200'

  return (
    <div className={`animate-pulse rounded-[2rem] border p-6 ${bg}`}>
      <div className={`h-5 w-1/3 rounded ${lineBg}`} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className={`mt-3 h-4 rounded ${lineBg}`} style={{ width: `${60 + Math.random() * 30}%` }} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4, dark = true }) {
  const bg = dark ? 'bg-white/10' : 'bg-slate-200'
  const borderColor = dark ? 'border-white/5' : 'border-slate-100'

  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={`flex gap-4 p-5 border-b ${borderColor}`}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`h-4 rounded flex-1 ${bg}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function SkeletonLoader({ type = 'card', count = 1, ...props }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => {
        if (type === 'table') return <SkeletonTable key={i} {...props} />
        if (type === 'line') return <SkeletonLine key={i} {...props} />
        return <SkeletonCard key={i} {...props} />
      })}
    </div>
  )
}
