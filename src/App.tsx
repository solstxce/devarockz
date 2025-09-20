import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { HomePage } from '@/pages/HomePage'
import { AuctionBrowsePage } from '@/pages/AuctionBrowsePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SellerLoginPage } from '@/pages/seller/SellerLoginPage'
import { SellerSignupPage } from '@/pages/seller/SellerSignupPage'
import { Toaster } from 'react-hot-toast'

function ProtectedRoute({ children, requireSeller = false }: { children: React.ReactNode; requireSeller?: boolean }) {
  const { currentUser, loading, userType, isAuthenticated, sellerUser, session } = useUnifiedAuth()
  
  console.log('ProtectedRoute Debug:', {
    loading,
    isAuthenticated,
    currentUser: !!currentUser,
    userType,
    requireSeller,
    sellerUser: !!sellerUser,
    session: !!session
  })
  
  if (loading) {
    console.log('ProtectedRoute: Still loading...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated || !currentUser) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login...')
    return <Navigate to={requireSeller ? "/seller/login" : "/login"} replace />
  }
  
  if (requireSeller && userType !== 'seller') {
    console.log('ProtectedRoute: Seller required but user is not seller, redirecting...')
    return <Navigate to="/seller/login" replace />
  }
  
  console.log('ProtectedRoute: Access granted!')
  return <>{children}</>
}

function AppContent() {
  const { currentUser, signOut, sellerSignOut, userType } = useUnifiedAuth()

  const handleSignOut = async () => {
    if (userType === 'seller') {
      await sellerSignOut()
    } else {
      await signOut()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={currentUser} onSignOut={handleSignOut} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auctions" element={<AuctionBrowsePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
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
              <ProtectedRoute requireSeller={true}>
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Welcome to your seller dashboard!</p>
                    <p className="text-sm text-gray-500 mt-2">User Type: {userType}</p>
                    {currentUser && (
                      <div className="mt-4">
                        <p><strong>Name:</strong> {currentUser.full_name}</p>
                        <p><strong>Email:</strong> {currentUser.email}</p>
                        <p><strong>Role:</strong> {currentUser.role}</p>
                      </div>
                    )}
                  </div>
                </div>
              </ProtectedRoute>
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
      <UnifiedAuthProvider>
        <AppContent />
      </UnifiedAuthProvider>
    </Router>
  )
}

export default App
