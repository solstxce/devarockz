import { apiClient, type ApiResponse } from '@/lib/api'
import type { Auction } from '@/lib/supabase'

// Backend data types
interface BidWithAuction {
  id: string
  auction_id: string
  bidder_id: string
  amount: number
  created_at: string
  auction?: {
    id: string
    title: string
    current_bid: number
    end_time: string
    status: string
    images?: string[]
    total_bids?: number
    seller?: {
      id: string
      full_name: string
    }
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UserDashboardStats {
  active_bids: number
  watching_count: number
  won_auctions: number
  items_sold: number
  total_spent: number
  total_earned: number
}

export interface UserBidSummary {
  auction_id: string
  auction_title: string
  auction_image?: string
  bid_amount: number
  current_bid: number
  status: 'leading' | 'outbid' | 'won' | 'lost'
  end_time: string
  is_winning: boolean
}

export interface WatchlistItem {
  auction_id: string
  auction_title: string
  auction_image?: string
  current_bid: number
  end_time: string
  bid_count: number
  status: string
}

export interface DashboardData {
  stats: UserDashboardStats
  activeBids: UserBidSummary[]
  watchlist: WatchlistItem[]
  recentActivity: Array<{
    type: 'bid' | 'won' | 'outbid' | 'watched'
    message: string
    timestamp: string
    auction_title: string
  }>
}

class UserDashboardService {
  // Get comprehensive dashboard data
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    try {
      console.log('[UserDashboard] Fetching dashboard data...')
      
      // Try to fetch real data first, but provide fallbacks
      const [statsResult, bidsResult, watchlistResult] = await Promise.allSettled([
        this.getUserStats(),
        this.getUserActiveBids(),
        this.getUserWatchlist()
      ])

            // Handle stats - calculate from actual data or provide defaults
      const stats: UserDashboardStats = {
        active_bids: 0,
        watching_count: 0,
        won_auctions: 0,
        items_sold: 0,
        total_spent: 0,
        total_earned: 0
      }

      // Handle bids - empty array if API fails
      let activeBids: UserBidSummary[] = []
      if (bidsResult.status === 'fulfilled' && bidsResult.value.success) {
        activeBids = bidsResult.value.data || []
        stats.active_bids = activeBids.length
      } else {
        console.warn('[UserDashboard] Bids API not available, using empty array')
      }

      // Handle watchlist - empty array if API fails
      let watchlist: WatchlistItem[] = []
      if (watchlistResult.status === 'fulfilled' && watchlistResult.value.success) {
        watchlist = watchlistResult.value.data || []
        stats.watching_count = watchlist.length
      } else {
        console.warn('[UserDashboard] Watchlist API not available, using empty array')
      }

      // Try to get additional stats from API if available
      if (statsResult.status === 'fulfilled' && statsResult.value.success && statsResult.value.data) {
        const apiStats = statsResult.value.data
        // Keep calculated values but use API values for other stats
        stats.won_auctions = apiStats.won_auctions || 0
        stats.items_sold = apiStats.items_sold || 0
        stats.total_spent = apiStats.total_spent || 0
        stats.total_earned = apiStats.total_earned || 0
      } else {
        console.warn('[UserDashboard] Stats API not available, using calculated values where possible')
      }

      const dashboardData: DashboardData = {
        stats,
        activeBids,
        watchlist,
        recentActivity: [] // TODO: Implement recent activity if needed
      }

      console.log('[UserDashboard] Dashboard data loaded:', dashboardData)
      
      return {
        success: true,
        data: dashboardData
      }
    } catch (error) {
      console.error('[UserDashboard] Error fetching dashboard data:', error)
      
      // Return default empty data instead of failing completely
      return {
        success: true,
        data: {
          stats: {
            active_bids: 0,
            watching_count: 0,
            won_auctions: 0,
            items_sold: 0,
            total_spent: 0,
            total_earned: 0
          },
          activeBids: [],
          watchlist: [],
          recentActivity: []
        }
      }
    }
  }

  // Get user statistics
  async getUserStats(): Promise<ApiResponse<UserDashboardStats>> {
    try {
      return await apiClient.get<UserDashboardStats>('/user/dashboard/stats')
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user stats'
      }
    }
  }

  // Get user's active bids
  async getUserActiveBids(): Promise<ApiResponse<UserBidSummary[]>> {
    try {
      console.log('[UserDashboard] Fetching user active bids from /bids/my/active')
      const response = await apiClient.get<BidWithAuction[]>('/bids/my/active')
      console.log('[UserDashboard] Active bids response:', response)
      
      if (response.success && response.data) {
        console.log('[UserDashboard] Raw bid data:', response.data)
        // Transform backend data to frontend format
        const transformedData: UserBidSummary[] = response.data.map((bid: BidWithAuction) => ({
          auction_id: bid.auction?.id || bid.auction_id,
          auction_title: bid.auction?.title || 'Unknown Auction',
          auction_image: bid.auction?.images?.[0] || undefined,
          bid_amount: bid.amount,
          current_bid: bid.auction?.current_bid || 0,
          status: this.determineBidStatus(bid, bid.auction),
          end_time: bid.auction?.end_time || new Date().toISOString(),
          is_winning: bid.amount >= (bid.auction?.current_bid || 0)
        }))
        
        console.log('[UserDashboard] Transformed bid data:', transformedData)
        return {
          success: true,
          data: transformedData
        }
      }
      
      console.warn('[UserDashboard] Active bids response unsuccessful or no data')
      return {
        success: false,
        error: 'Failed to fetch active bids'
      }
    } catch (error) {
      console.error('[UserDashboard] Error fetching active bids:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active bids'
      }
    }
  }

  // Get user's watchlist
  async getUserWatchlist(): Promise<ApiResponse<WatchlistItem[]>> {
    try {
      return await apiClient.get<WatchlistItem[]>('/user/watchlist')
    } catch (error) {
      console.error('Error fetching watchlist:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch watchlist'
      }
    }
  }

  // Get all user bids (for history page)
  async getUserBidHistory(page = 1, limit = 20): Promise<ApiResponse<UserBidSummary[]>> {
    try {
      const params = { page: String(page), limit: String(limit) }
      const response = await apiClient.get<{
        data: BidWithAuction[]
        pagination?: PaginationInfo
      }>('/bids/my/bids', params)
      
      if (response.success && response.data?.data) {
        // Transform backend data to frontend format
        const transformedData: UserBidSummary[] = response.data.data.map((bid: BidWithAuction) => ({
          auction_id: bid.auction?.id || bid.auction_id,
          auction_title: bid.auction?.title || 'Unknown Auction',
          auction_image: bid.auction?.images?.[0] || undefined,
          bid_amount: bid.amount,
          current_bid: bid.auction?.current_bid || 0,
          status: this.determineBidStatus(bid, bid.auction),
          end_time: bid.auction?.end_time || new Date().toISOString(),
          is_winning: bid.amount >= (bid.auction?.current_bid || 0)
        }))
        
        return {
          success: true,
          data: transformedData
        }
      }
      
      return {
        success: false,
        error: 'Failed to fetch bid history'
      }
    } catch (error) {
      console.error('Error fetching bid history:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bid history'
      }
    }
  }

  // Helper method to determine bid status
  private determineBidStatus(bid: BidWithAuction, auction?: BidWithAuction['auction']): UserBidSummary['status'] {
    if (!auction) return 'lost'
    
    const now = new Date()
    const endTime = new Date(auction.end_time)
    const isAuctionEnded = endTime <= now
    const isWinning = bid.amount >= auction.current_bid
    
    if (isAuctionEnded) {
      return isWinning ? 'won' : 'lost'
    } else {
      return isWinning ? 'leading' : 'outbid'
    }
  }

  // Add item to watchlist
  async addToWatchlist(auctionId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.post<void>('/user/watchlist', { auction_id: auctionId })
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add to watchlist'
      }
    }
  }

  // Remove item from watchlist
  async removeFromWatchlist(auctionId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/user/watchlist/${auctionId}`)
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove from watchlist'
      }
    }
  }

  // Get user's won auctions
  async getUserWonAuctions(page = 1, limit = 20): Promise<ApiResponse<Auction[]>> {
    try {
      const params = { page: String(page), limit: String(limit) }
      return await apiClient.get<Auction[]>('/user/won-auctions', params)
    } catch (error) {
      console.error('Error fetching won auctions:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch won auctions'
      }
    }
  }
}

export const userDashboardService = new UserDashboardService()
export default userDashboardService