import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '../services/api'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await api.post('/auth/forgot-password', data)
      setMessage(res.data.message || 'If this email exists, a reset link has been sent.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8">
        <h1 className="text-2xl font-black mb-2">Forgot Password</h1>
        <p className="text-slate-400 mb-6">Enter your email and we will send a reset link.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="your@email.com"
              className={`w-full rounded-xl border ${errors.email ? 'border-red-500/50' : 'border-white/10'} bg-slate-800 px-4 py-3`}
              {...register('email')}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <button disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 font-bold disabled:opacity-70">
            {loading ? 'Sending...' : 'Send reset link'}
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
