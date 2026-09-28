import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthModal } from '../context/AuthModalContext'

/** `/login` and `/register` stay linkable, but they just pop the auth modal
 *  over the home page (Zillow-style) rather than being standalone pages. */
export default function LoginPage({ mode = 'login' }) {
  const { openAuth } = useAuthModal()
  useEffect(() => {
    openAuth(mode)
  }, [openAuth, mode])
  return <Navigate to="/" replace />
}
