import { apiClient, type ApiResponse } from '@/lib/api'
import type { Auction } from '@/lib/supabase'

export interface CreatePostingData {
  type: 'product' | 'auction'
  title: string
  description: string
  category_id: string
  images?: string[]
  condition: 'new' | 'used' | 'refurbished'
  shipping_cost: number
  shipping_methods: string[]
  // Product fields
  price?: number
  stock_quantity?: number
  // Auction fields
  starting_price?: number
  reserve_price?: number
  bid_increment?: number
  start_time?: string
  end_time?: string
}

export interface UpdatePostingData {
  title?: string
  description?: string
  category_id?: string
  images?: string[]
  condition?: 'new' | 'used' | 'refurbished'
  shipping_cost?: number
  shipping_methods?: string[]
  price?: number
  stock_quantity?: number
  starting_price?: number
  reserve_price?: number
  bid_increment?: number
  start_time?: string
  end_time?: string
}

export interface ConvertToAuctionData {
  starting_price: number
  reserve_price?: number
  bid_increment: number
  start_time: string
  end_time: string
}

export interface PostingResponse {
  type: 'product' | 'auction'
  id: string
  title: string
  description: string
  // Can be either product or auction data
  [key: string]: unknown
}

class PostingService {
  // Create new posting (product or auction)
  async createPosting(data: CreatePostingData): Promise<ApiResponse<PostingResponse>> {
    return await apiClient.post<PostingResponse>('/seller/postings', data)
  }

  // Get posting by ID
  async getPosting(id: string): Promise<ApiResponse<PostingResponse>> {
    return await apiClient.get<PostingResponse>(`/seller/postings/${id}`)
  }

  // Update posting
  async updatePosting(id: string, data: UpdatePostingData): Promise<ApiResponse<PostingResponse>> {
    return await apiClient.put<PostingResponse>(`/seller/postings/${id}`, data)
  }

  // Delete posting
  async deletePosting(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/seller/postings/${id}`)
  }

  // Update posting status
  async updatePostingStatus(id: string, status: 'draft' | 'active' | 'inactive' | 'completed' | 'cancelled'): Promise<ApiResponse<PostingResponse>> {
    return await apiClient.patch<PostingResponse>(`/seller/postings/${id}/status`, { status })
  }

  // Convert product to auction
  async convertToAuction(id: string, data: ConvertToAuctionData): Promise<ApiResponse<PostingResponse>> {
    return await apiClient.post<PostingResponse>(`/seller/postings/${id}/convert-to-auction`, data)
  }
}

export const postingService = new PostingService()