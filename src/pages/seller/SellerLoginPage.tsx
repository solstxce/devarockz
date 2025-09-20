import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Store, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { sellerAuthService, type SellerLoginData } from '@/services/sellerAuthService'
import toast from 'react-hot-toast'

const sellerLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type SellerLoginForm = z.infer<typeof sellerLoginSchema>

export function SellerLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SellerLoginForm>({
    resolver: zodResolver(sellerLoginSchema)
  })

  const onSubmit = async (data: SellerLoginForm) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await sellerAuthService.sellerSignin(data as SellerLoginData)

      if (response.success && response.data) {
        // Store authentication data (you might want to use a proper auth context)
        localStorage.setItem('seller_token', response.data.token)
        localStorage.setItem('seller_user', JSON.stringify(response.data.user))
        localStorage.setItem('seller_profile', JSON.stringify(response.data.seller_profile))

        toast.success('Welcome back! Redirecting to your dashboard...')
        navigate('/seller/dashboard')
      } else {
        setError(response.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Seller login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
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
            <CardTitle className="text-2xl font-bold text-gray-900">Seller Login</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your seller account to manage your products and auctions
            </CardDescription>
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 transition-all"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Seller Dashboard'}
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

        {/* Features for sellers */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Seller Dashboard Features:</p>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="font-medium">Product Management</div>
              <div>List & manage products</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="font-medium">Auction Creation</div>
              <div>Create & monitor auctions</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="font-medium">Sales Analytics</div>
              <div>Track your performance</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="font-medium">Order Management</div>
              <div>Handle orders & shipping</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}