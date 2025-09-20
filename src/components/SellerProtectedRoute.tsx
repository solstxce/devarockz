import { Navigate } from 'react-router-dom'
import { useSellerAuth } from '@/hooks/useSellerAuth'
import { useEffect, useState } from 'react'

interface SellerProtectedRouteProps {
  children: React.ReactNode
}

export function SellerProtectedRoute({ children }: SellerProtectedRouteProps) {
  const { getSellerUser } = useSellerAuth()
  const [isChecking, setIsChecking] = useState(true)
  const [sellerAuth, setSellerAuth] = useState<ReturnType<typeof getSellerUser>>(null)

  useEffect(() => {
    // Small delay to prevent immediate redirect on page load
    const timer = setTimeout(() => {
      const auth = getSellerUser()
      setSellerAuth(auth)
      setIsChecking(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [getSellerUser])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!sellerAuth) {
    return <Navigate to="/seller/login" replace />
  }

  return <>{children}</>
}