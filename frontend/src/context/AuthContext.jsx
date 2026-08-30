import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { fetchMe, loginUser, registerUser } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(credentials) {
    const { access, refresh } = await loginUser(credentials)
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    const me = await fetchMe()
    setUser(me)
    return me
  }

  async function register(details) {
    await registerUser(details)
    return login({ username: details.username, password: details.password })
  }

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
