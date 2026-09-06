import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wrench, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

const nameRegex = /^[A-Za-z][A-Za-z\s'-]* [A-Za-z][A-Za-z\s'-]*$/
const saPhoneRegex = /^0\d{9}$/
const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/
const normalizeName = (value) => String(value || '').toLowerCase().replace(/[^a-z]/g, '')

const adminRegisterSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').regex(nameRegex, 'Please enter a proper full name (first and last name) with letters only'),
  email: z.string().email('Enter a valid email address')
    .refine((val) => /[A-Za-z]/.test(val.split('@')[0]), 'Email cannot be numbers only. Please use a real email address.'),
  phone: z.string().optional().refine((val) => !val || saPhoneRegex.test(val), 'Use a valid South African 10-digit number (e.g. 0821234567)'),
  pin: z.string().optional(),
  password: z.string().regex(
    strongPasswordRegex,
    'Password must be 6+ characters and include a letter, number, and special character'
  ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => normalizeName(data.password) !== normalizeName(data.full_name), {
  message: 'Password must not be the same as your name',
  path: ['password'],
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function AdminRegister() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(adminRegisterSchema)
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredAdmin, setRegisteredAdmin] = useState(null)
  const navigate = useNavigate()

  // Watch password fields for real-time match indicator
  const passwordValue = watch('password', '')
  const confirmPasswordValue = watch('confirmPassword', '')
  const passwordsEntered = passwordValue.length > 0 && confirmPasswordValue.length > 0
  const passwordsMatch = passwordValue === confirmPasswordValue

  // Block non-numeric input for phone field
  const handlePhoneKeyDown = (e) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
    if (allowed.includes(e.key)) return
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const handlePhoneInput = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '')
    if (cleaned !== e.target.value) {
      e.target.value = cleaned
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { confirmPassword, ...submitData } = data
      const res = await api.post('/auth/register-admin', submitData)
      setRegisteredAdmin(res.data.user)
      setSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AppLayout title="Workshop Registration Successful">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-emerald-100">
            <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wrench className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome to the Team!</h2>
            <p className="text-slate-500 mb-8">Your mechanic account has been created. You can now access the workshop tools and diagnostics.</p>
            
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Staff Profile</p>
              <p className="text-slate-700 font-bold">{registeredAdmin?.full_name}</p>
              <p className="text-slate-500 text-sm">{registeredAdmin?.email}</p>
              <p className="text-emerald-600 text-xs font-bold mt-2 uppercase">Role: Workshop Admin</p>
            </div>

            <Link 
              to="/admin/login" 
              className="block w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all"
            >
              Access Workshop Login
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Join the Team">
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-8 py-10 text-white text-center">
            <h2 className="text-3xl font-bold">Mechanic Portal</h2>
            <p className="mt-2 text-emerald-100">Access workshop tools and diagnostics</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <input 
                placeholder="Enter your full name" 
                className={`w-full border ${errors.full_name ? 'border-red-500' : 'border-slate-200'} p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                {...register('full_name')} 
              />
              {errors.full_name && <p className="text-red-500 text-xs font-bold pl-1 mt-1">{errors.full_name.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">Work Email</label>
              <input 
                type="email"
                placeholder="mechanic@workshop.com" 
                className={`w-full border ${errors.email ? 'border-red-500' : 'border-slate-200'} p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                {...register('email')} 
              />
              {errors.email && <p className="text-red-500 text-xs font-bold pl-1 mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Phone</label>
                <input 
                  type="tel"
                  inputMode="numeric"
                  placeholder="0821234567"
                  maxLength="10"
                  onKeyDown={handlePhoneKeyDown}
                  onInput={handlePhoneInput}
                  className={`w-full border ${errors.phone ? 'border-red-500' : 'border-slate-200'} p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                  {...register('phone')} 
                />
                {errors.phone && <p className="text-red-500 text-xs font-bold pl-1 mt-1">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Staff PIN</label>
                <input 
                  type="password"
                  maxLength="4"
                  placeholder="4 digits" 
                  className={`w-full border ${errors.pin ? 'border-red-500' : 'border-slate-200'} p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                  {...register('pin')} 
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <input 
                type="password" 
                placeholder="Create a secure password" 
                className={`w-full border ${errors.password ? 'border-red-500' : 'border-slate-200'} p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                {...register('password')} 
              />
              {errors.password && <p className="text-red-500 text-xs font-bold pl-1 mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">Confirm Password</label>
              <input 
                type="password" 
                placeholder="Re-enter your password" 
                className={`w-full border ${errors.confirmPassword ? 'border-red-500' : passwordsEntered && passwordsMatch ? 'border-emerald-500' : 'border-slate-200'} p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 ${passwordsEntered && passwordsMatch ? 'focus:ring-emerald-500' : 'focus:ring-emerald-500'} focus:border-transparent outline-none transition-all`}
                {...register('confirmPassword')} 
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs font-bold pl-1 mt-1">{errors.confirmPassword.message}</p>}
              {!errors.confirmPassword && passwordsEntered && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-1.5 pl-1 mt-1.5 text-xs font-bold ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}
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
            
            <button 
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : 'Register as Mechanic'}
            </button>
            
            <p className="text-center text-slate-600 mt-4">
              Already have an account?{' '}
              <Link to="/admin/login" className="text-emerald-600 font-bold hover:underline">
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
