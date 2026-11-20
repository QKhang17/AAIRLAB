import { createContext, useContext, useMemo, useState } from 'react'
import { loginApi, logoutApi } from '../services/api'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem('aair_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    sessionStorage.removeItem('aair_user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      async login(credentials) {
        const response = await loginApi(credentials)
        const session = response.data

        sessionStorage.setItem('aair_user', JSON.stringify(session.user))
        setUser(session.user)

        return session.user
      },
      async logout() {
        await logoutApi().catch(() => null)
        sessionStorage.removeItem('aair_user')
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
