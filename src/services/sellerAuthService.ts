import { apiClient, type ApiResponse } from '@/lib/api'
import type { User } from '@/lib/supabase'

export interface SellerProfile {
  id: string
  user_id: string
  business_name: string
  business_type: 'individual' | 'company' | 'partnership'
  phone: string
  business_address: {
    street: string
    city: string
    state: string
    zip_code: string
    country: string
  }
  tax_id?: string
  verification_status: 'pending' | 'verified' | 'rejected'
  verification_documents?: {
    business_license?: string
    tax_document?: string
    identity_document?: string
    additional_documents?: string[]
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SellerSignupData {
  email: string
  password: string
  full_name: string
  business_name: string
  business_type: 'individual' | 'company' | 'partnership'
  phone: string
  business_address: {
    street: string
    city: string
    state: string
    zip_code: string
    country: string
  }
  tax_id?: string
}

export interface SellerLoginData {
  email: string
  password: string
}

export interface SellerAuthResponse {
  user: User
  seller_profile: SellerProfile
  token: string
}

export interface BusinessVerificationData {
  business_license: string
  tax_document?: string
  identity_document: string
  additional_documents?: string[]
}

export interface VerificationStatusResponse {
  status: string
  documents?: BusinessVerificationData
}

class SellerAuthService {
  // Seller signup
  async sellerSignup(data: SellerSignupData): Promise<ApiResponse<SellerAuthResponse>> {
    return await apiClient.post<SellerAuthResponse>('/seller/auth/signup', data)
  }

  // Seller signin
  async sellerSignin(data: SellerLoginData): Promise<ApiResponse<SellerAuthResponse>> {
    return await apiClient.post<SellerAuthResponse>('/seller/auth/signin', data)
  }

  // Get seller profile
  async getSellerProfile(): Promise<ApiResponse<{ user: User; seller_profile: SellerProfile }>> {
    return await apiClient.get<{ user: User; seller_profile: SellerProfile }>('/seller/auth/profile')
  }

  // Update seller profile
  async updateSellerProfile(data: Partial<SellerProfile>): Promise<ApiResponse<SellerProfile>> {
    return await apiClient.put<SellerProfile>('/seller/auth/profile', data)
  }

  // Submit business verification
  async submitBusinessVerification(data: BusinessVerificationData): Promise<ApiResponse<SellerProfile>> {
    return await apiClient.post<SellerProfile>('/seller/auth/verify-business', data)
  }

  // Get verification status
  async getVerificationStatus(): Promise<ApiResponse<VerificationStatusResponse>> {
    return await apiClient.get<VerificationStatusResponse>('/seller/auth/verification-status')
  }
}

export const sellerAuthService = new SellerAuthService()