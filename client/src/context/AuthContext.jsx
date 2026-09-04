import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuthLogout } from '../services/api'

const AuthContext = createContext(null)

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  // Initialise state from localStorage (for page refresh persistence)
  const [user, setUser] = useState(() => readStorage('user'))
  const [admin, setAdmin] = useState(() => readStorage('adminUser'))
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || null)

  const login = useCallback((userData, jwt) => {
    // Clear any admin session first
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setAdmin(null)
    setAdminToken(null)

    // Set user session
    localStorage.setItem('token', jwt)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)
  }, [])

  const adminLogin = useCallback((adminData, jwt) => {
    // Clear any user session first
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)

    // Set admin session
    localStorage.setItem('adminToken', jwt)
    localStorage.setItem('adminUser', JSON.stringify(adminData))
    setAdminToken(jwt)
    setAdmin(adminData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setUser(null)
    setAdmin(null)
    setToken(null)
    setAdminToken(null)
    navigate('/', { replace: true })
  }, [navigate])

  // Silently clear auth state without navigation (used by API interceptor)
  const clearAuth = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setUser(null)
    setAdmin(null)
    setToken(null)
    setAdminToken(null)
  }, [])

  const updateUser = useCallback((updatedData) => {
    const merged = { ...user, ...updatedData }
    localStorage.setItem('user', JSON.stringify(merged))
    setUser(merged)
  }, [user])

  const value = useMemo(() => ({
    user,
    admin,
    token,
    adminToken,
    isAuthenticated: !!(user || admin),
    isUser: !!user,
    isAdmin: !!admin,
    login,
    adminLogin,
    logout,
    clearAuth,
    updateUser,
  }), [user, admin, token, adminToken, login, adminLogin, logout, clearAuth, updateUser])

  // Register the logout function with the API interceptor
  setAuthLogout(clearAuth)

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
