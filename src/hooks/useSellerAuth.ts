import { useState } from 'react'
import { sellerAuthService } from '@/services/sellerAuthService'

export function useSellerAuth() {
  const [loading, setLoading] = useState(false)

  const sellerSignIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await sellerAuthService.sellerSignin({ email, password })

      if (response.success && response.data) {
        const { user, seller_profile, token } = response.data

        // Store in localStorage
        localStorage.setItem('seller_token', token)
        localStorage.setItem('seller_user', JSON.stringify(user))
        localStorage.setItem('seller_profile', JSON.stringify(seller_profile))

        return { error: undefined }
      } else {
        return { error: new Error(response.error || 'Seller login failed') }
      }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
    } finally {
      setLoading(false)
    }
  }

  const sellerSignOut = () => {
    localStorage.removeItem('seller_token')
    localStorage.removeItem('seller_user')
    localStorage.removeItem('seller_profile')
  }

  const getSellerUser = () => {
    const token = localStorage.getItem('seller_token')
    const userData = localStorage.getItem('seller_user')
    const profileData = localStorage.getItem('seller_profile')

    if (token && userData && profileData) {
      return {
        token,
        user: JSON.parse(userData),
        profile: JSON.parse(profileData)
      }
    }
    return null
  }

  return {
    sellerSignIn,
    sellerSignOut,
    getSellerUser,
    loading
  }
}