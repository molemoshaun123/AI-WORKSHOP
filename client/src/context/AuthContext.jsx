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

/**
 * Decode a JWT and check if it is expired.
 * Returns true if the token is valid and NOT expired.
 */
function isTokenValid(jwt) {
  if (!jwt || typeof jwt !== 'string') return false
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.exp) return false
    // exp is in seconds, Date.now() is in ms
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

/**
 * On startup, validate stored tokens.
 * If a token is expired or invalid, clear that session from localStorage
 * so that the user cannot access protected routes without re-authenticating.
 */
function getValidatedInitialState() {
  const storedToken = localStorage.getItem('token') || null
  const storedAdminToken = localStorage.getItem('adminToken') || null
  const storedUser = readStorage('user')
  const storedAdmin = readStorage('adminUser')

  let user = storedUser
  let token = storedToken
  let admin = storedAdmin
  let adminToken = storedAdminToken

  // Validate user token
  if (token && !isTokenValid(token)) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    user = null
    token = null
  }

  // Validate admin token
  if (adminToken && !isTokenValid(adminToken)) {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    admin = null
    adminToken = null
  }

  // If there's user data but no valid token, clear user
  if (user && !token) {
    localStorage.removeItem('user')
    user = null
  }

  // If there's admin data but no valid token, clear admin
  if (admin && !adminToken) {
    localStorage.removeItem('adminUser')
    admin = null
  }

  return { user, token, admin, adminToken }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  // Initialise state from localStorage with JWT validation
  const initial = useMemo(() => getValidatedInitialState(), [])
  const [user, setUser] = useState(initial.user)
  const [admin, setAdmin] = useState(initial.admin)
  const [token, setToken] = useState(initial.token)
  const [adminToken, setAdminToken] = useState(initial.adminToken)

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
