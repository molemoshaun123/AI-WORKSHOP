import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2 } from 'lucide-react'
import api from '../../services/api'

const adminLoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function AdminLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(adminLoginSchema)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/login-admin', data)
      localStorage.setItem('adminToken', res.data.token)
      localStorage.setItem('adminUser', JSON.stringify(res.data.user))
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-[-7rem] top-[-6rem] h-80 w-80 rounded-full bg-emerald-500/20 blur-[120px] animate-pulse"></div>
        <div className="absolute left-[-8rem] bottom-[-6rem] h-96 w-96 rounded-full bg-teal-500/15 blur-[140px] animate-pulse"></div>
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-2xl lg:grid-cols-2">
          <div className="relative hidden overflow-hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/70 via-teal-700/60 to-slate-950/90"></div>
            <div className="absolute left-[-3rem] top-[-3rem] h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl"></div>
            <div className="absolute bottom-[-3rem] right-[-3rem] h-48 w-48 rounded-full bg-teal-200/20 blur-3xl"></div>

            <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-black text-slate-950">
                  K
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100">Workshop Access</p>
                  <h1 className="text-xl font-black tracking-tight">AUTO TUNE</h1>
                </div>
              </Link>

              <div>
                <div className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-100">
                  Internal staff only
                </div>
                <h2 className="max-w-md text-5xl font-black leading-tight">
                  Enter the
                  <span className="block text-emerald-300">workshop command center.</span>
                </h2>
                <p className="mt-5 max-w-md text-lg leading-8 text-emerald-100/75">
                  Manage jobs, monitor customers, use workshop tools, and keep the workshop running smoothly.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Live jobs', '01'],
                  ['Workshop tools', '02'],
                  ['Inventory', '03'],
                ].map(([label, num]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="text-xs font-black text-emerald-100">{num}</div>
                    <div className="mt-2 text-sm font-bold">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center p-6 sm:p-8 lg:p-12">
            <div className="w-full">
              <div className="mb-8">
                <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                  Admin login
                </div>
                <h3 className="text-3xl font-black tracking-tight sm:text-4xl">Sign in</h3>
                <p className="mt-3 text-slate-400">
                  Access the workshop management system.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Work email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="email"
                      placeholder="mechanic@workshop.com"
                      className={`w-full rounded-2xl border ${errors.email ? 'border-red-500/50' : 'border-white/10'} bg-slate-800/60 px-4 py-4 pl-12 text-sm font-semibold outline-none transition focus:border-emerald-400/40 focus:bg-slate-800`}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-red-400 text-xs font-bold mt-2 pl-1"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className={`w-full rounded-2xl border ${errors.password ? 'border-red-500/50' : 'border-white/10'} bg-slate-800/60 px-4 py-4 pl-12 text-sm font-semibold outline-none transition focus:border-emerald-400/40 focus:bg-slate-800`}
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-red-400 text-xs font-bold mt-2 pl-1"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </motion.div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white shadow-xl shadow-emerald-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : 'Open Control Center'}
                </motion.button>
              </form>

              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  New team member?{' '}
                  <Link
                    to="/admin/register"
                    className="font-bold text-emerald-400 transition hover:text-emerald-300"
                  >
                    Register account
                  </Link>
                </p>

                <Link
                  to="/"
                  className="font-bold text-slate-300 transition hover:text-white"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}