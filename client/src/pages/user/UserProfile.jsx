import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'
import { User, Mail, Phone, Lock, Save } from 'lucide-react'

export default function UserProfile() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    current_password: '',
    new_password: '',
  })

  // Load latest data from DB (optional, but good practice to sync)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile')
        setFormData(prev => ({
          ...prev,
          full_name: res.data.full_name,
          email: res.data.email,
          phone: res.data.phone || '',
        }))
        // Update local storage
        localStorage.setItem('user', JSON.stringify({ ...user, ...res.data }))
      } catch (e) {
        // Silent fail or toast error
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.put('/auth/profile', {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
      })
      toast.success('Profile updated successfully')
      localStorage.setItem('user', JSON.stringify({ ...user, ...res.data.user }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!formData.current_password || !formData.new_password) {
      toast.error('Both passwords are required')
      return
    }
    if (formData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await api.put('/auth/password', {
        current_password: formData.current_password,
        new_password: formData.new_password,
      })
      toast.success('Password updated successfully')
      setFormData(prev => ({ ...prev, current_password: '', new_password: '' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="My Profile">
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Personal Details */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Personal Details</h2>
              <p className="text-sm font-semibold text-slate-400">Manage your account information</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:border-cyan-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:border-cyan-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:border-cyan-500 outline-none"
                  placeholder="e.g. 082 123 4567"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </form>
        </div>

        {/* Security */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl h-fit">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Security</h2>
              <p className="text-sm font-semibold text-slate-400">Update your password</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:border-purple-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:border-purple-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-700 transition-all border border-white/10 disabled:opacity-50"
            >
              Update Password
            </button>
          </form>
        </div>

      </div>
    </AppLayout>
  )
}
