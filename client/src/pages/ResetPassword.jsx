import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/

const resetPasswordSchema = z.object({
  password: z.string().regex(
    strongPasswordRegex,
    'Password must be 6+ characters and include a letter, number, and special character'
  ),
  confirmPassword: z.string().min(6, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function ResetPassword() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error'
  const [message, setMessage] = useState('')
  const { token } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  })

  // Watch password fields for real-time match indicator
  const passwordValue = watch('password', '')
  const confirmPasswordValue = watch('confirmPassword', '')
  const passwordsEntered = passwordValue.length > 0 && confirmPasswordValue.length > 0
  const passwordsMatch = passwordValue === confirmPasswordValue

  const onSubmit = async (data) => {
    setLoading(true)
    setStatus(null)
    setMessage('')
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password: data.password })
      setMessage(res.data.message || 'Password reset successful! Redirecting to login...')
      setStatus('success')
      setTimeout(() => navigate('/user/login', { replace: true }), 2000)
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Reset password failed'
      setMessage(
        errMsg.includes('expired')
          ? 'This reset link has expired. Please request a new one.'
          : errMsg.includes('invalid')
          ? 'This reset link is invalid. Please request a new one.'
          : errMsg
      )
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/15 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/10 blur-3xl -z-10"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 backdrop-blur-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 mr-2" />
              Secure Reset
            </div>
            <h1 className="text-3xl font-black mb-2">Reset Password</h1>
            <p className="text-slate-400 font-medium">Set a new, strong password for your account.</p>
          </div>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="h-20 w-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-3">Password Updated!</h2>
              <p className="text-emerald-300 font-semibold text-sm">{message}</p>
              <div className="mt-6 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'linear' }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    className={`w-full rounded-2xl border ${errors.password ? 'border-red-500/50' : 'border-white/10'} bg-slate-800/60 px-4 py-4 pl-12 text-sm font-semibold outline-none transition focus:border-emerald-400/40 focus:bg-slate-800`}
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-red-400 text-xs font-bold pl-1"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="password"
                    placeholder="Re-enter your new password"
                    className={`w-full rounded-2xl border ${errors.confirmPassword ? 'border-red-500/50' : passwordsEntered && passwordsMatch ? 'border-emerald-500/50' : 'border-white/10'} bg-slate-800/60 px-4 py-4 pl-12 text-sm font-semibold outline-none transition focus:border-emerald-400/40 focus:bg-slate-800`}
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-red-400 text-xs font-bold pl-1"
                  >
                    {errors.confirmPassword.message}
                  </motion.p>
                )}
                {!errors.confirmPassword && passwordsEntered && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-1.5 pl-1 text-xs font-bold ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Passwords match
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Passwords do not match
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white shadow-xl shadow-emerald-500/20 transition duration-300 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : 'Reset Password'}
              </motion.button>
            </form>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300">{message}</p>
                  {message.includes('expired') || message.includes('invalid') ? (
                    <Link to="/forgot-password" className="text-xs font-bold text-red-400 hover:text-red-300 underline mt-2 inline-block">
                      Request a new reset link →
                    </Link>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back Link */}
          <div className="mt-6 text-sm">
            <Link to="/user/login" className="flex items-center gap-2 font-bold text-slate-400 transition hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
