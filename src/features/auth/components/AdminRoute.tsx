import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AuthLoadingScreen } from '@/shared/components/AuthLoadingScreen'

export function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <AuthLoadingScreen minHeight="50vh" />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
