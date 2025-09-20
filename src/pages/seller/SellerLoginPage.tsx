import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Store, ArrowLeft, Eye, EyeOff, Shield, Star, Users, TrendingUp, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useSellerAuth } from '@/hooks/useSellerAuth'
import toast from 'react-hot-toast'

const sellerLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type SellerLoginForm = z.infer<typeof sellerLoginSchema>

export function SellerLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loginAttempts, setLoginAttempts] = useState(0)
  const navigate = useNavigate()
  const { sellerSignIn, loading } = useSellerAuth()

  // Load saved credentials if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('seller_remember_email')
    const savedRemember = localStorage.getItem('seller_remember_me')

    if (savedEmail && savedRemember === 'true') {
      // You could pre-fill the email field here
      setRememberMe(true)
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<SellerLoginForm>({
    resolver: zodResolver(sellerLoginSchema)
  })

  const onSubmit = async (data: SellerLoginForm) => {
    try {
      setError('')
      setLoginAttempts(prev => prev + 1)

      console.log('Seller login: Starting authentication...')
      const { error } = await sellerSignIn(data.email, data.password)

      if (!error) {
        console.log('Seller login: Authentication successful, showing toast...')

        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('seller_remember_email', data.email)
          localStorage.setItem('seller_remember_me', 'true')
        } else {
          localStorage.removeItem('seller_remember_email')
          localStorage.removeItem('seller_remember_me')
        }

        toast.success('Welcome back! Redirecting to your dashboard...')

        // Add a small delay to ensure state is updated before redirect
        setTimeout(() => {
          console.log('Seller login: Redirecting to dashboard...')
          navigate('/seller/dashboard')
        }, 500)
      } else {
        console.error('Seller login: Authentication failed:', error)
        setError(error.message || 'Login failed. Please try again.')

        // Show additional security message after multiple failed attempts
        if (loginAttempts >= 2) {
          setError('Multiple failed attempts. For security, please verify your credentials or contact support.')
        }
      }
    } catch (error) {
      console.error('Seller login error:', error)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to main site */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to AuctionHub
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Seller Portal</CardTitle>
            <CardDescription className="text-gray-600">
              Access your seller dashboard to manage auctions and track sales
            </CardDescription>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Secure Login
              </Badge>
              <Badge variant="outline" className="text-xs">
                2FA Available
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your business email"
                  {...register('email')}
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className="pr-10 transition-all focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me on this device
                </Label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In to Seller Dashboard'
                )}
              </Button>
            </form>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <Link 
                  to="/seller/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="text-center text-sm text-gray-600">
                Don't have a seller account?{' '}
                <Link 
                  to="/seller/signup" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create one here
                </Link>
              </div>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Looking for buyer login?
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust indicators and features */}
        <div className="mt-8 space-y-6">
          {/* Trust badges */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Trusted by thousands of sellers</p>
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Verified Sellers</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Top Rated</span>
              </div>
            </div>
          </div>

          {/* Live stats */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
            <div className="text-center mb-4">
              <p className="text-lg font-semibold text-gray-900">Live Marketplace Stats</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">2,847</div>
                <div className="text-xs text-gray-600">Active Sellers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">$1.2M</div>
                <div className="text-xs text-gray-600">Monthly Sales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">98.5%</div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Features for sellers */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Seller Dashboard Features:</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center space-x-2 mb-1">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Product Management</span>
                </div>
                <div className="text-gray-600">List & manage products</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Auction Creation</span>
                </div>
                <div className="text-gray-600">Create & monitor auctions</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center space-x-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium">Sales Analytics</span>
                </div>
                <div className="text-gray-600">Track your performance</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Order Management</span>
                </div>
                <div className="text-gray-600">Handle orders & shipping</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}