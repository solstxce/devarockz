import { Navigate } from 'react-router-dom'
import { useSellerAuth } from '@/hooks/useSellerAuth'

interface SellerProtectedRouteProps {
  children: React.ReactNode
}

export function SellerProtectedRoute({ children }: SellerProtectedRouteProps) {
  const { getSellerUser } = useSellerAuth()
  const sellerAuth = getSellerUser()

  if (!sellerAuth) {
    return <Navigate to="/seller/login" replace />
  }

  return <>{children}</>
}