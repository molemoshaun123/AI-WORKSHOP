import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmModal({ open, isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant, isDanger, onConfirm, onCancel, onClose, loading = false, children }) {
  const isModalOpen = open || isOpen;
  const handleCancel = onCancel || onClose;
  
  const variants = {
    danger: {
      confirmBtn: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20',
      icon: '🗑️',
      iconBg: 'bg-red-500/10 border-red-500/20',
    },
    warning: {
      confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20',
      icon: '⚠️',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
    },
    success: {
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
      icon: '✅',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    info: {
      confirmBtn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20',
      icon: 'ℹ️',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
    },
  }

  let v = variants.danger;
  if (variant) {
    v = variants[variant] || variants.danger;
  } else if (isDanger !== undefined) {
    v = isDanger ? variants.danger : variants.info;
  }

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-2xl"
          >
            <div className="text-center space-y-4">
              <div className={`mx-auto h-16 w-16 rounded-full border ${v.iconBg} flex items-center justify-center text-3xl`}>
                {v.icon}
              </div>
              <h3 className="text-xl font-black text-white">{title}</h3>
              {message && <p className="text-sm text-slate-400 leading-7">{message}</p>}
            </div>

            {children && <div className="mt-6">{children}</div>}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-black text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 rounded-2xl py-3 text-sm font-black transition disabled:opacity-50 ${v.confirmBtn}`}
              >
                {loading ? 'Processing...' : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
