import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function UserLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login-user', data)
      login(res.data.user, res.data.token)
      toast.success('Welcome back!')
      navigate('/user/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 blur-3xl -z-10"></div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        {/* Left Side - Visual */}
        <div className="relative hidden lg:block overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 to-indigo-900/60 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80" 
            className="absolute inset-0 h-full w-full object-cover grayscale opacity-50"
            alt="Workshop"
          />
          <div className="relative z-20 p-16 h-full flex flex-col justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-950 shadow-xl group-hover:scale-110 transition-transform text-xl">K</div>
              <h1 className="text-2xl font-black tracking-tight text-white">AUTO TUNE</h1>
            </Link>
            
            <div>
              <h2 className="text-5xl font-black mb-6 leading-tight">Welcome to the<br/><span className="text-blue-400">Future of Repair.</span></h2>
              <p className="text-blue-100/70 text-lg max-w-sm">Access your personalized vehicle dashboard and track your service in real-time.</p>
            </div>

            <div className="flex gap-4">
              <div className="h-1 w-12 bg-white rounded-full"></div>
              <div className="h-1 w-4 bg-white/20 rounded-full"></div>
              <div className="h-1 w-4 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-16 lg:p-20 flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h3 className="text-3xl font-black mb-2">Customer Login</h3>
            <p className="text-slate-400 font-medium">Manage your vehicles and service requests</p>
          </motion.div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-2"
            >
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="email"
                  placeholder="your@email.com" 
                  className={`w-full bg-slate-800/50 border ${errors.email ? 'border-red-500/50' : 'border-white/5'} p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold text-sm`}
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
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Password</label>
                <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300">Forgot?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className={`w-full bg-slate-800/50 border ${errors.password ? 'border-red-500/50' : 'border-white/5'} p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold text-sm`}
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
            </motion.div>
            
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              disabled={loading}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-3 mt-10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : 'Access Dashboard'}
            </motion.button>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center text-slate-500 text-sm mt-8 font-bold"
            >
              Don't have an account?{' '}
              <Link to="/user/register" className="text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                Create one now
              </Link>
            </motion.p>
          </form>
        </div>
      </div>
    </div>
  )
}
