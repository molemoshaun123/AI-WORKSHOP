import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hover, setHover] = useState(0)

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const starSize = sizes[size] || sizes.md

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value)
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`transition-all duration-150 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <Star
              className={`${starSize} transition-colors ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-slate-400'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
