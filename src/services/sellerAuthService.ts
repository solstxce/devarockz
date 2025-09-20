import type { ApiResponse } from '@/lib/api'
import type { User } from '@/lib/supabase'

// Seller-specific API client that doesn't depend on Supabase auth
class SellerApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  }

  // Get seller auth token from localStorage
  private getSellerToken(): string | null {
    return localStorage.getItem('seller_token')
  }

  // Generic request method for seller API
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      }
      
      // Add seller auth header if token exists
      const token = this.getSellerToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP error! status: ${response.status}`
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Seller API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // HTTP methods
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint)
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

// Create seller API client instance
const sellerApiClient = new SellerApiClient()

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
    return await sellerApiClient.post<SellerAuthResponse>('/seller/auth/signup', data)
  }

  // Seller signin
  async sellerSignin(data: SellerLoginData): Promise<ApiResponse<SellerAuthResponse>> {
    return await sellerApiClient.post<SellerAuthResponse>('/seller/auth/signin', data)
  }

  // Get seller profile
  async getSellerProfile(): Promise<ApiResponse<{ user: User; seller_profile: SellerProfile }>> {
    return await sellerApiClient.get<{ user: User; seller_profile: SellerProfile }>('/seller/auth/profile')
  }

  // Update seller profile
  async updateSellerProfile(data: Partial<SellerProfile>): Promise<ApiResponse<SellerProfile>> {
    return await sellerApiClient.put<SellerProfile>('/seller/auth/profile', data)
  }

  // Submit business verification
  async submitBusinessVerification(data: BusinessVerificationData): Promise<ApiResponse<SellerProfile>> {
    return await sellerApiClient.post<SellerProfile>('/seller/auth/verify-business', data)
  }

  // Get verification status
  async getVerificationStatus(): Promise<ApiResponse<VerificationStatusResponse>> {
    return await sellerApiClient.get<VerificationStatusResponse>('/seller/auth/verification-status')
  }
}

export const sellerAuthService = new SellerAuthService()