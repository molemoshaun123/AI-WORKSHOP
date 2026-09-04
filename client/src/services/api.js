import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 120000,
})

// Module-level reference to AuthContext's clearAuth function
// Set by AuthProvider on mount so the interceptor can clear React state
let _authLogout = null

export function setAuthLogout(fn) {
  _authLogout = fn
}

api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken')
    const userToken = localStorage.getItem('token')
    const token = adminToken || userToken

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const isAdminArea = window.location.pathname.startsWith('/admin')

      // Clear React auth state if available
      if (_authLogout) {
        _authLogout()
      }

      // Also clear localStorage directly as fallback
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')

      if (!['/user/login', '/admin/login', '/'].includes(window.location.pathname)) {
        window.location.href = isAdminArea ? '/admin/login' : '/user/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api