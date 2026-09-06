import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error'
  const [message, setMessage] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setStatus(null)
    setMessage('')
    try {
      const res = await api.post('/auth/forgot-password', data)
      setMessage(res.data.message || 'If this email exists, a reset link has been sent.')
      setStatus('success')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to process request. Please try again.')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 blur-3xl -z-10"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 backdrop-blur-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
              Account Recovery
            </div>
            <h1 className="text-3xl font-black mb-2">Forgot Password</h1>
            <p className="text-slate-400 font-medium">Enter your email and we'll send a secure reset link.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  className={`w-full rounded-2xl border ${errors.email ? 'border-red-500/50' : 'border-white/10'} bg-slate-800/60 px-4 py-4 pl-12 text-sm font-semibold outline-none transition focus:border-blue-400/40 focus:bg-slate-800`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-red-400 text-xs font-bold pl-1"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-4 py-4 font-black text-white shadow-xl shadow-blue-500/20 transition duration-300 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : 'Send Reset Link'}
            </motion.button>
          </form>

          {/* Status Messages */}
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={`mt-5 rounded-2xl border p-4 flex items-start gap-3 ${
                  status === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/10'
                    : 'border-red-500/20 bg-red-500/10'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <p className={`text-sm font-semibold ${status === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back Link */}
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/user/login" className="flex items-center gap-2 font-bold text-slate-400 transition hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
            <Link to="/admin/login" className="font-bold text-slate-500 transition hover:text-emerald-400">
              Admin login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
