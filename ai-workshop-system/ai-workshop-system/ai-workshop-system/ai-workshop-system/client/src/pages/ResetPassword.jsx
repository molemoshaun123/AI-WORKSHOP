import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  const [message, setMessage] = useState('')
  const { token } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password: data.password })
      setMessage(res.data.message || 'Password reset successful.')
      setTimeout(() => navigate('/user/login', { replace: true }), 1500)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Reset password failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8">
        <h1 className="text-2xl font-black mb-2">Reset Password</h1>
        <p className="text-slate-400 mb-6">Set a new password for your account.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="New password"
              className={`w-full rounded-xl border ${errors.password ? 'border-red-500/50' : 'border-white/10'} bg-slate-800 px-4 py-3`}
              {...register('password')}
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <input
              type="password"
              placeholder="Confirm new password"
              className={`w-full rounded-xl border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'} bg-slate-800 px-4 py-3`}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button disabled={loading} className="w-full rounded-xl bg-emerald-600 py-3 font-bold disabled:opacity-70">
            {loading ? 'Saving...' : 'Reset password'}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
        <div className="mt-4 text-sm">
          <Link to="/user/login" className="text-blue-400 hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
