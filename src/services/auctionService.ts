import { apiClient, type ApiResponse, type PaginatedResponse } from '@/lib/api'
import type { Auction, Bid } from '@/lib/supabase'

export interface AuctionFilters {
  category?: string
  status?: 'active' | 'completed' | 'draft' | 'cancelled'
  search?: string
  minPrice?: number
  maxPrice?: number
  condition?: 'new' | 'used' | 'refurbished'
  page?: number
  limit?: number
  sortBy?: 'ending_soon' | 'price_low' | 'price_high' | 'newest' | 'popular'
}

export interface CreateAuctionData {
  title: string
  description: string
  categoryId: string
  startingPrice: number
  reservePrice?: number
  bidIncrement: number
  startTime: string
  endTime: string
  condition: 'new' | 'used' | 'refurbished'
  shippingCost: number
  shippingMethods: string[]
  images: string[]
}

export interface PlaceBidData {
  auctionId: string
  amount: number
  isAutoBid?: boolean
  maxAutoBid?: number
}

class AuctionService {
  // Get all auctions with optional filters (public endpoint)
  async getAuctions(filters?: AuctionFilters): Promise<PaginatedResponse<Auction>> {
    const params: Record<string, string> = {}
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = String(value)
        }
      })
    }

    return await apiClient.get<Auction[]>('/auctions/search', params)
  }

  // Get a single auction by ID
  async getAuction(id: string): Promise<ApiResponse<Auction>> {
    return await apiClient.get<Auction>(`/auctions/${id}`)
  }

  // Create a new auction
  async createAuction(data: CreateAuctionData): Promise<ApiResponse<Auction>> {
    return await apiClient.post<Auction>('/auctions', data)
  }

  // Update an auction
  async updateAuction(id: string, data: Partial<CreateAuctionData>): Promise<ApiResponse<Auction>> {
    return await apiClient.put<Auction>(`/auctions/${id}`, data)
  }

  // Delete an auction
  async deleteAuction(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/auctions/${id}`)
  }

  // Get auction bids
  async getAuctionBids(auctionId: string): Promise<ApiResponse<Bid[]>> {
    return await apiClient.get<Bid[]>(`/auctions/${auctionId}/bids`)
  }

  // Place a bid on an auction
  async placeBid(data: PlaceBidData): Promise<ApiResponse<Bid>> {
    return await apiClient.post<Bid>('/bids', data)
  }

  // Get user's auctions (as seller)
  async getUserAuctions(userId: string): Promise<ApiResponse<Auction[]>> {
    return await apiClient.get<Auction[]>(`/auctions/user/${userId}`)
  }

  // Get user's bids
  async getUserBids(userId: string): Promise<ApiResponse<Bid[]>> {
    return await apiClient.get<Bid[]>(`/bids/user/${userId}`)
  }

  // Join auction room for real-time updates
  joinAuctionRoom(auctionId: string): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.emit('join_auction', auctionId)
    }
  }

  // Leave auction room
  leaveAuctionRoom(auctionId: string): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.emit('leave_auction', auctionId)
    }
  }

  // Subscribe to auction updates
  onAuctionUpdate(auctionId: string, callback: (auction: Auction) => void): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.on(`auction_updated_${auctionId}`, callback)
    }
  }

  // Subscribe to new bids
  onNewBid(auctionId: string, callback: (bid: Bid) => void): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.on(`bid_placed_${auctionId}`, callback)
    }
  }

  // Subscribe to auction end
  onAuctionEnd(auctionId: string, callback: (auction: Auction) => void): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.on(`auction_ended_${auctionId}`, callback)
    }
  }

  // Unsubscribe from auction events
  offAuctionEvents(auctionId: string): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.off(`auction_updated_${auctionId}`)
      socket.off(`bid_placed_${auctionId}`)
      socket.off(`auction_ended_${auctionId}`)
    }
  }
}

export const auctionService = new AuctionService()