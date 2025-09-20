import { supabase } from './database'
import { AppError } from '@/middleware/error'

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

export interface CreateSellerProfileData {
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

export interface UpdateSellerProfileData {
  business_name?: string
  business_type?: 'individual' | 'company' | 'partnership'
  phone?: string
  business_address?: {
    street: string
    city: string
    state: string
    zip_code: string
    country: string
  }
  tax_id?: string
}

export interface BusinessVerificationData {
  business_license: string
  tax_document?: string
  identity_document: string
  additional_documents?: string[]
}

export class SellerService {
  private static instance: SellerService

  static getInstance(): SellerService {
    if (!SellerService.instance) {
      SellerService.instance = new SellerService()
    }
    return SellerService.instance
  }

  // Create seller profile
  async createSellerProfile(userId: string, profileData: CreateSellerProfileData): Promise<SellerProfile> {
    const { data: sellerProfile, error } = await supabase
      .from('seller_profiles')
      .insert({
        user_id: userId,
        business_name: profileData.business_name,
        business_type: profileData.business_type,
        phone: profileData.phone,
        business_address: profileData.business_address,
        tax_id: profileData.tax_id,
        verification_status: 'pending',
        is_active: true
      })
      .select()
      .single()

    if (error || !sellerProfile) {
      throw new AppError(error?.message || 'Failed to create seller profile', 500)
    }

    return sellerProfile
  }

  // Get seller profile
  async getSellerProfile(userId: string): Promise<SellerProfile | null> {
    const { data: sellerProfile, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new AppError(error.message, 500)
    }

    return sellerProfile
  }

  // Update seller profile
  async updateSellerProfile(userId: string, updateData: UpdateSellerProfileData): Promise<SellerProfile> {
    const { data: sellerProfile, error } = await supabase
      .from('seller_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !sellerProfile) {
      throw new AppError(error?.message || 'Failed to update seller profile', 500)
    }

    return sellerProfile
  }

  // Submit business verification documents
  async submitBusinessVerification(userId: string, documents: BusinessVerificationData): Promise<any> {
    const { data: verification, error } = await supabase
      .from('seller_profiles')
      .update({
        verification_documents: documents,
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !verification) {
      throw new AppError(error?.message || 'Failed to submit verification documents', 500)
    }

    return verification
  }

  // Get verification status
  async getVerificationStatus(userId: string): Promise<{ status: string; documents?: any }> {
    const { data: sellerProfile, error } = await supabase
      .from('seller_profiles')
      .select('verification_status, verification_documents')
      .eq('user_id', userId)
      .single()

    if (error || !sellerProfile) {
      throw new AppError(error?.message || 'Failed to get verification status', 500)
    }

    return {
      status: sellerProfile.verification_status,
      documents: sellerProfile.verification_documents
    }
  }

  // Get seller statistics
  async getSellerStats(userId: string): Promise<any> {
    try {
      const [productsResult, auctionsResult, ordersResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, status')
          .eq('seller_id', userId),
        supabase
          .from('auctions')
          .select('id, status')
          .eq('seller_id', userId),
        supabase
          .from('orders')
          .select('id, status, total_amount')
          .eq('seller_id', userId)
      ])

      const products = productsResult.data || []
      const auctions = auctionsResult.data || []
      const orders = ordersResult.data || []

      return {
        total_products: products.length,
        active_products: products.filter(p => p.status === 'active').length,
        total_auctions: auctions.length,
        active_auctions: auctions.filter(a => a.status === 'active').length,
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        pending_orders: orders.filter(o => o.status === 'pending').length
      }
    } catch (error) {
      throw new AppError('Failed to get seller statistics', 500)
    }
  }

  // List seller's products and auctions
  async getSellerListings(userId: string, type?: 'products' | 'auctions', page = 1, limit = 20): Promise<any> {
    const offset = (page - 1) * limit

    if (type === 'products' || !type) {
      const { data: products, error: productsError, count: productsCount } = await supabase
        .from('products')
        .select('*, category:categories(*)', { count: 'exact' })
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (productsError) {
        throw new AppError(productsError.message, 500)
      }

      if (type === 'products') {
        return {
          success: true,
          data: products || [],
          pagination: {
            page,
            limit,
            total: productsCount || 0,
            totalPages: Math.ceil((productsCount || 0) / limit)
          }
        }
      }
    }

    if (type === 'auctions' || !type) {
      const { data: auctions, error: auctionsError, count: auctionsCount } = await supabase
        .from('auctions')
        .select('*, category:categories(*)', { count: 'exact' })
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (auctionsError) {
        throw new AppError(auctionsError.message, 500)
      }

      if (type === 'auctions') {
        return {
          success: true,
          data: auctions || [],
          pagination: {
            page,
            limit,
            total: auctionsCount || 0,
            totalPages: Math.ceil((auctionsCount || 0) / limit)
          }
        }
      }
    }

    // If no type specified, return both
    const [productsResult, auctionsResult] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('auctions')
        .select('*, category:categories(*)')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    return {
      success: true,
      data: {
        products: productsResult.data || [],
        auctions: auctionsResult.data || []
      }
    }
  }
}