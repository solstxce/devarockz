import { supabase } from './database'
import type { 
  Auction, 
  CreateAuctionRequest, 
  SearchFiltersRequest, 
  ApiResponse 
} from '@/types'

export class AuctionService {
  private static instance: AuctionService

  private constructor() {}

  public static getInstance(): AuctionService {
    if (!AuctionService.instance) {
      AuctionService.instance = new AuctionService()
    }
    return AuctionService.instance
  }

  // Create new auction
  async createAuction(sellerId: string, auctionData: CreateAuctionRequest): Promise<Auction> {
    const {
      title,
      description,
      category_id,
      starting_price,
      reserve_price,
      bid_increment,
      start_time,
      end_time,
      condition,
      shipping_cost,
      shipping_methods,
      images = []
    } = auctionData

    const { data: auction, error } = await supabase
      .from('auctions')
      .insert({
        seller_id: sellerId,
        title,
        description,
        category_id,
        starting_price,
        reserve_price,
        current_bid: starting_price,
        bid_increment,
        start_time,
        end_time,
        condition,
        shipping_cost,
        shipping_methods,
        images,
        status: 'draft'
      })
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*)
      `)
      .single()

    if (error || !auction) {
      throw new Error(error?.message || 'Failed to create auction')
    }

    return auction
  }

  // Get auction by ID
  async getAuctionById(auctionId: string): Promise<Auction | null> {
    const { data: auction, error } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*),
        winner:users!winner_id(*)
      `)
      .eq('id', auctionId)
      .single()

    if (error || !auction) {
      return null
    }

    return auction
  }

  // Search auctions with filters
  async searchAuctions(filters: SearchFiltersRequest): Promise<ApiResponse<Auction[]>> {
    const {
      query,
      category,
      condition,
      minPrice,
      maxPrice,
      endingIn,
      sortBy = 'created_at',
      status = 'active',
      page = 1,
      limit = 20
    } = filters

    let queryBuilder = supabase
      .from('auctions')
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*)
      `, { count: 'exact' })

    // Apply filters
    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category)
    }

    if (condition) {
      queryBuilder = queryBuilder.eq('condition', condition)
    }

    if (minPrice) {
      queryBuilder = queryBuilder.gte('current_bid', minPrice)
    }

    if (maxPrice) {
      queryBuilder = queryBuilder.lte('current_bid', maxPrice)
    }

    if (endingIn) {
      const now = new Date()
      let endTime: Date

      switch (endingIn) {
        case '1h':
          endTime = new Date(now.getTime() + 60 * 60 * 1000)
          break
        case '6h':
          endTime = new Date(now.getTime() + 6 * 60 * 60 * 1000)
          break
        case '24h':
          endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          break
        case '3d':
          endTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
          break
        case '7d':
          endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        default:
          endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      }

      queryBuilder = queryBuilder.lte('end_time', endTime.toISOString())
    }

    // Apply sorting
    switch (sortBy) {
      case 'ending_soon':
        queryBuilder = queryBuilder.order('end_time', { ascending: true })
        break
      case 'newly_listed':
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
      case 'price_low':
        queryBuilder = queryBuilder.order('current_bid', { ascending: true })
        break
      case 'price_high':
        queryBuilder = queryBuilder.order('current_bid', { ascending: false })
        break
      case 'most_bids':
        queryBuilder = queryBuilder.order('total_bids', { ascending: false })
        break
      default:
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: auctions, error, count } = await queryBuilder

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

  // Get auctions by seller
  async getAuctionsBySeller(sellerId: string, page = 1, limit = 20): Promise<ApiResponse<Auction[]>> {
    const offset = (page - 1) * limit

    const { data: auctions, error, count } = await supabase
      .from('auctions')
      .select(`
        *,
        category:categories(*)
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
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

  // Update auction
  async updateAuction(auctionId: string, sellerId: string, updates: Partial<Auction>): Promise<Auction> {
    const { data: auction, error } = await supabase
      .from('auctions')
      .update(updates)
      .eq('id', auctionId)
      .eq('seller_id', sellerId)
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*)
      `)
      .single()

    if (error || !auction) {
      throw new Error(error?.message || 'Failed to update auction')
    }

    return auction
  }

  // Delete auction
  async deleteAuction(auctionId: string, sellerId: string): Promise<void> {
    const { error } = await supabase
      .from('auctions')
      .delete()
      .eq('id', auctionId)
      .eq('seller_id', sellerId)

    if (error) {
      throw new Error(error.message)
    }
  }

  // Activate auction
  async activateAuction(auctionId: string, sellerId: string): Promise<Auction> {
    return this.updateAuction(auctionId, sellerId, { status: 'active' })
  }

  // End auction
  async endAuction(auctionId: string): Promise<Auction> {
    // Get the highest bid to determine winner
    const { data: highestBid } = await supabase
      .from('bids')
      .select('bidder_id, amount')
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false })
      .limit(1)
      .single()

    const updates: Partial<Auction> = {
      status: 'completed'
    }

    if (highestBid) {
      updates.winner_id = highestBid.bidder_id
    }

    const { data: auction, error } = await supabase
      .from('auctions')
      .update(updates)
      .eq('id', auctionId)
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*),
        winner:users!winner_id(*)
      `)
      .single()

    if (error || !auction) {
      throw new Error(error?.message || 'Failed to end auction')
    }

    return auction
  }

  // Get ending auctions (for automated processing)
  async getEndingAuctions(): Promise<Auction[]> {
    const now = new Date().toISOString()

    const { data: auctions, error } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*)
      `)
      .eq('status', 'active')
      .lte('end_time', now)

    if (error) {
      throw new Error(error.message)
    }

    return auctions || []
  }

  // Get featured auctions
  async getFeaturedAuctions(limit = 6): Promise<Auction[]> {
    const { data: auctions, error } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*)
      `)
      .eq('status', 'active')
      .order('total_bids', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    return auctions || []
  }
}