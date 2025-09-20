import { apiClient, type ApiResponse, type PaginatedResponse } from '@/lib/api'
import type { Auction, Product } from '@/lib/supabase'

export interface SellerStats {
  total_products: number
  active_products: number
  total_auctions: number
  active_auctions: number
  total_orders: number
  total_revenue: number
  pending_orders: number
}

export interface DashboardOverview {
  stats: SellerStats
  recent_listings: {
    products: Product[]
    auctions: Auction[]
  }
}

export interface SellerListingsQuery {
  type?: 'products' | 'auctions'
  status?: 'draft' | 'active' | 'inactive' | 'completed' | 'cancelled'
  page?: number
  limit?: number
  search?: string
}

class SellerDashboardService {
  // Get seller statistics
  async getSellerStats(): Promise<ApiResponse<SellerStats>> {
    return await apiClient.get<SellerStats>('/seller/dashboard/stats')
  }

  // Get dashboard overview
  async getDashboardOverview(): Promise<ApiResponse<DashboardOverview>> {
    return await apiClient.get<DashboardOverview>('/seller/dashboard/overview')
  }

  // Get seller listings (products and/or auctions)
  async getSellerListings(query?: SellerListingsQuery): Promise<PaginatedResponse<Product | Auction>> {
    const params: Record<string, string> = {}
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = String(value)
        }
      })
    }

    return await apiClient.get<(Product | Auction)[]>('/seller/dashboard/listings', params)
  }

  // Get seller products only
  async getSellerProducts(page = 1, limit = 20): Promise<PaginatedResponse<Product>> {
    const params = { page: String(page), limit: String(limit) }
    return await apiClient.get<Product[]>('/seller/dashboard/products', params)
  }

  // Get seller auctions only
  async getSellerAuctions(page = 1, limit = 20): Promise<PaginatedResponse<Auction>> {
    const params = { page: String(page), limit: String(limit) }
    return await apiClient.get<Auction[]>('/seller/dashboard/auctions', params)
  }

  // Get seller orders
  async getSellerOrders(page = 1, limit = 20): Promise<PaginatedResponse<unknown>> {
    const params = { page: String(page), limit: String(limit) }
    return await apiClient.get<unknown[]>('/seller/dashboard/orders', params)
  }

  // Get sales analytics
  async getSalesAnalytics(): Promise<ApiResponse<{
    revenue_this_month: number
    revenue_last_month: number
    orders_this_month: number
    orders_last_month: number
    top_categories: unknown[]
    revenue_trend: unknown[]
    popular_products: unknown[]
  }>> {
    return await apiClient.get('/seller/dashboard/sales-analytics')
  }

  // Get performance metrics
  async getPerformanceMetrics(): Promise<ApiResponse<{
    conversion_rate: number
    average_order_value: number
    customer_satisfaction: number
    return_rate: number
    response_time: number
  }>> {
    return await apiClient.get('/seller/dashboard/performance')
  }
}

export const sellerDashboardService = new SellerDashboardService()