import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import PageLoader from './PageLoader'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth()
  const { openAuth } = useAuthModal()
  const location = useLocation()

  const denied = !loading && (!user || (requireAdmin && !isAdmin))

  useEffect(() => {
    if (!loading && !user) openAuth('login')
  }, [loading, user, openAuth])

  if (loading) return <PageLoader />

  if (denied) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}
