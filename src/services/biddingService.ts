import { apiClient, type ApiResponse } from '@/lib/api'
import type { Bid } from '@/lib/supabase'

export interface PlaceBidData {
  auctionId: string
  amount: number
  isAutoBid?: boolean
  maxAutoBid?: number
}

export interface BidHistory {
  auction_id: string
  auction_title: string
  bid_amount: number
  bid_time: string
  status: 'active' | 'outbid' | 'won' | 'lost'
  is_winning: boolean
}

class BiddingService {
  // Place a bid on an auction
  async placeBid(data: PlaceBidData): Promise<ApiResponse<Bid>> {
    try {
      console.log('[BiddingService] Placing bid:', data)
      
      // Check if we have authentication
      const authToken = localStorage.getItem('auth_token') || localStorage.getItem('seller_token')
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required. Please sign in.'
        }
      }
      
      const result = await apiClient.post<Bid>('/bids', {
        auction_id: data.auctionId, // Backend expects auction_id, not auctionId
        amount: data.amount,
        is_auto_bid: data.isAutoBid || false,
        max_auto_bid: data.maxAutoBid
      })
      
      console.log('[BiddingService] Bid result:', result)
      return result
      
    } catch (error) {
      console.error('[BiddingService] Error placing bid:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          return {
            success: false,
            error: 'Authentication required. Please sign in again.'
          }
        }
        if (error.message.includes('403')) {
          return {
            success: false,
            error: 'Access denied. You may not have permission to bid on this auction.'
          }
        }
        if (error.message.includes('400')) {
          return {
            success: false,
            error: 'Invalid bid. Please check the bid amount and try again.'
          }
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to place bid'
      }
    }
  }

  // Get bid history for a specific auction
  async getAuctionBids(auctionId: string): Promise<ApiResponse<Bid[]>> {
    try {
      return await apiClient.get<Bid[]>(`/auctions/${auctionId}/bids`)
    } catch (error) {
      console.error('Error fetching auction bids:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bids'
      }
    }
  }

  // Get user's bid history
  async getUserBids(): Promise<ApiResponse<BidHistory[]>> {
    try {
      return await apiClient.get<BidHistory[]>('/bids/my-bids')
    } catch (error) {
      console.error('Error fetching user bids:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bid history'
      }
    }
  }

  // Get user's active bids (where they're currently winning or have active bids)
  async getActiveBids(): Promise<ApiResponse<BidHistory[]>> {
    try {
      return await apiClient.get<BidHistory[]>('/bids/active')
    } catch (error) {
      console.error('Error fetching active bids:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active bids'
      }
    }
  }

  // Cancel an auto-bid (if supported)
  async cancelAutoBid(bidId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/bids/${bidId}/auto`)
    } catch (error) {
      console.error('Error canceling auto-bid:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel auto-bid'
      }
    }
  }

  // Get bidding statistics for a user
  async getBiddingStats(): Promise<ApiResponse<{
    total_bids: number
    active_bids: number
    won_auctions: number
    total_spent: number
    win_rate: number
  }>> {
    try {
      return await apiClient.get('/bids/stats')
    } catch (error) {
      console.error('Error fetching bidding stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bidding stats'
      }
    }
  }
}

export const biddingService = new BiddingService()
export default biddingService