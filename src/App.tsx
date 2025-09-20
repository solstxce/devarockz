import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { useAuth } from '@/hooks/useAuth'
import { SellerProtectedRoute } from '@/components/SellerProtectedRoute'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { HomePage } from '@/pages/HomePage'
import { AuctionBrowsePage } from '@/pages/AuctionBrowsePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SellerLoginPage } from '@/pages/seller/SellerLoginPage'
import { SellerSignupPage } from '@/pages/seller/SellerSignupPage'
import { SellerDashboardPage } from '@/pages/seller/SellerDashboardPage'
import { SellerProfilePage } from '@/pages/seller/SellerProfilePage'
import { SellPage } from '@/pages/SellPage'
import { WatchlistPage } from '@/pages/WatchlistPage'
import { Toaster } from 'react-hot-toast'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  console.log('ProtectedRoute: Checking auth state:', {
    user: !!user,
    loading,
    userEmail: user?.email,
    userId: user?.id
  })

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing spinner...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login...')
    return <Navigate to="/login" replace />
  }

  console.log('ProtectedRoute: User authenticated, rendering children...')
  return <>{children}</>
}

function AppContent() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onSignOut={signOut} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auctions" element={<AuctionBrowsePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* User routes */}
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/sell" element={<SellPage />} />

          {/* Seller routes */}
          <Route path="/seller/login" element={<SellerLoginPage />} />
          <Route path="/seller/signup" element={<SellerSignupPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Seller protected routes */}
          <Route
            path="/seller/dashboard"
            element={
              <SellerProtectedRoute>
                <SellerDashboardPage />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/seller/profile"
            element={
              <SellerProtectedRoute>
                <SellerProfilePage />
              </SellerProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
