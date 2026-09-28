import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [state, setState] = useState({ open: false, mode: 'login' })

  const openAuth = useCallback((mode = 'login') => {
    setState({ open: true, mode })
  }, [])

  const closeAuth = useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])

  const setMode = useCallback((mode) => {
    setState((s) => ({ ...s, mode }))
  }, [])

  const value = useMemo(
    () => ({ ...state, openAuth, closeAuth, setMode }),
    [state, openAuth, closeAuth, setMode]
  )

  return (
    <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return ctx
}
