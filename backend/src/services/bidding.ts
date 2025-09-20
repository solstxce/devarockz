import { supabase } from './database'
import { RealTimeService } from './realtime'
import type { Bid, PlaceBidRequest, Auction, ApiResponse } from '@/types'

export class BiddingService {
  private static instance: BiddingService

  private constructor() {}

  public static getInstance(): BiddingService {
    if (!BiddingService.instance) {
      BiddingService.instance = new BiddingService()
    }
    return BiddingService.instance
  }

  // Place a bid
  async placeBid(bidderId: string, bidData: PlaceBidRequest, ipAddress: string): Promise<{ bid: Bid; auction: Auction }> {
    const { auction_id, amount, is_auto_bid = false, max_auto_bid } = bidData

    // Get auction details
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auction_id)
      .single()

    if (auctionError || !auction) {
      throw new Error('Auction not found')
    }

    // Validate auction status
    if (auction.status !== 'active') {
      throw new Error('Auction is not active')
    }

    // Check if auction has ended
    if (new Date(auction.end_time) <= new Date()) {
      throw new Error('Auction has ended')
    }

    // Check if bidder is not the seller
    if (auction.seller_id === bidderId) {
      throw new Error('Sellers cannot bid on their own auctions')
    }

    // Validate bid amount
    const minBidAmount = auction.current_bid + auction.bid_increment
    if (amount < minBidAmount) {
      throw new Error(`Minimum bid amount is $${minBidAmount}`)
    }

    // Check reserve price if exists
    if (auction.reserve_price && amount < auction.reserve_price) {
      throw new Error(`Bid must meet reserve price of $${auction.reserve_price}`)
    }

    // Validate auto-bid settings
    if (is_auto_bid) {
      if (!max_auto_bid || max_auto_bid <= amount) {
        throw new Error('Maximum auto-bid must be higher than current bid')
      }
    }

    // Place the bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        auction_id,
        bidder_id: bidderId,
        amount,
        is_auto_bid,
        max_auto_bid,
        ip_address: ipAddress
      })
      .select(`
        *,
        bidder:users!bidder_id(*),
        auction:auctions(*)
      `)
      .single()

    if (bidError || !bid) {
      throw new Error(bidError?.message || 'Failed to place bid')
    }

    // Get updated auction
    const { data: updatedAuction, error: updateError } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*)
      `)
      .eq('id', auction_id)
      .single()

    if (updateError || !updatedAuction) {
      throw new Error('Failed to get updated auction')
    }

    // Emit real-time events
    const realTimeService = RealTimeService.getInstance()
    
    // Emit bid placed event to all watchers of this auction
    realTimeService.emitBidPlaced(auction_id, bid, updatedAuction)
    
    // Update seller statistics
    realTimeService.emitSellerStatsUpdated(auction.seller_id, null) // null triggers refetch

    return { bid, auction: updatedAuction }
  }

  // Get bids for an auction
  async getAuctionBids(auctionId: string, page = 1, limit = 20): Promise<ApiResponse<Bid[]>> {
    const offset = (page - 1) * limit

    const { data: bids, error, count } = await supabase
      .from('bids')
      .select(`
        *,
        bidder:users(id, full_name, avatar_url)
      `, { count: 'exact' })
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: bids || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  }

  // Get user's bids
  async getUserBids(userId: string, page = 1, limit = 20): Promise<ApiResponse<Bid[]>> {
    const offset = (page - 1) * limit

    const { data: bids, error, count } = await supabase
      .from('bids')
      .select(`
        *,
        auction:auctions(
          id,
          title,
          current_bid,
          end_time,
          status,
          images,
          seller:users!auctions_seller_id_fkey(id, full_name)
        )
      `, { count: 'exact' })
      .eq('bidder_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: bids || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  }

  // Get user's active bids (auctions still ongoing)
  async getUserActiveBids(userId: string): Promise<Bid[]> {
    const now = new Date().toISOString()

    const { data: bids, error } = await supabase
      .from('bids')
      .select(`
        *,
        auction:auctions(
          id,
          title,
          current_bid,
          end_time,
          status,
          images,
          total_bids,
          seller:users!auctions_seller_id_fkey(id, full_name)
        )
      `)
      .eq('bidder_id', userId)
      .eq('auction.status', 'active')
      .gt('auction.end_time', now)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return bids || []
  }

  // Get user's won auctions
  async getUserWonAuctions(userId: string, page = 1, limit = 10): Promise<ApiResponse<Auction[]>> {
    const offset = (page - 1) * limit

    const { data: auctions, error, count } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:users!auctions_seller_id_fkey(id, full_name, email, phone),
        category:categories(*)
      `, { count: 'exact' })
      .eq('winner_id', userId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: auctions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  }

  // Get highest bid for auction
  async getHighestBid(auctionId: string): Promise<Bid | null> {
    const { data: bid, error } = await supabase
      .from('bids')
      .select(`
        *,
        bidder:users(id, full_name, avatar_url)
      `)
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false })
      .limit(1)
      .single()

    if (error || !bid) {
      return null
    }

    return bid
  }

  // Check if user is highest bidder
  async isHighestBidder(auctionId: string, userId: string): Promise<boolean> {
    const highestBid = await this.getHighestBid(auctionId)
    return highestBid?.bidder_id === userId
  }

  // Get bid statistics for auction
  async getBidStatistics(auctionId: string): Promise<{
    totalBids: number
    uniqueBidders: number
    averageBid: number
    highestBid: number
    lowestBid: number
  }> {
    const { data: stats, error } = await supabase
      .rpc('get_bid_statistics', { auction_id: auctionId })

    if (error) {
      throw new Error(error.message)
    }

    return stats || {
      totalBids: 0,
      uniqueBidders: 0,
      averageBid: 0,
      highestBid: 0,
      lowestBid: 0
    }
  }

  // Process auto-bids when a new bid is placed
  async processAutoBids(auctionId: string, currentBid: number): Promise<void> {
    // Get all auto-bids for this auction that are higher than current bid
    const { data: autoBids, error } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .eq('is_auto_bid', true)
      .gt('max_auto_bid', currentBid)
      .order('max_auto_bid', { ascending: false })

    if (error || !autoBids || autoBids.length === 0) {
      return
    }

    // Get auction details
    const { data: auction } = await supabase
      .from('auctions')
      .select('bid_increment, current_bid')
      .eq('id', auctionId)
      .single()

    if (!auction) {
      return
    }

    // Find the highest auto-bid that should win
    const winningAutoBid = autoBids[0]
    const nextBidAmount = auction.current_bid + auction.bid_increment

    if (winningAutoBid.max_auto_bid >= nextBidAmount) {
      // Place automatic bid
      await supabase
        .from('bids')
        .insert({
          auction_id: auctionId,
          bidder_id: winningAutoBid.bidder_id,
          amount: Math.min(nextBidAmount, winningAutoBid.max_auto_bid),
          is_auto_bid: true,
          max_auto_bid: winningAutoBid.max_auto_bid,
          ip_address: '127.0.0.1' // System bid
        })
    }
  }
}