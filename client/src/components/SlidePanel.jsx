import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function SlidePanel({ open, isOpen, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  const showPanel = open || isOpen;
  return (
    <AnimatePresence>
      {showPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed right-0 top-0 z-[95] h-full ${width} w-full border-l border-white/10 bg-slate-900 shadow-2xl flex flex-col`}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                {subtitle && (
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{subtitle}</p>
                )}
                <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
