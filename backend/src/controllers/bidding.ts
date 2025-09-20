import { Request, Response } from 'express'
import { BiddingService } from '@/services/bidding'
import { AppError, asyncHandler } from '@/middleware/error'
import type { PlaceBidRequest, ApiResponse, Bid, Auction } from '@/types'

export class BiddingController {
  private biddingService: BiddingService

  constructor() {
    this.biddingService = BiddingService.getInstance()
  }

  // Place a bid
  placeBid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const bidData: PlaceBidRequest = req.body
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'

    const result = await this.biddingService.placeBid(req.userId, bidData, ipAddress)

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: result
    } as ApiResponse<{ bid: Bid; auction: Auction }>)
  })

  // Get bids for an auction
  getAuctionBids = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { auctionId } = req.params
    const { page = 1, limit = 20 } = req.query

    if (!auctionId) {
      throw new AppError('Auction ID is required', 400)
    }

    const result = await this.biddingService.getAuctionBids(
      auctionId,
      Number(page),
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Get user's bids
  getUserBids = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { page = 1, limit = 20 } = req.query

    const result = await this.biddingService.getUserBids(
      req.userId,
      Number(page),
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Get user's active bids
  getUserActiveBids = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const bids = await this.biddingService.getUserActiveBids(req.userId)

    res.status(200).json({
      success: true,
      data: bids
    } as ApiResponse<Bid[]>)
  })

  // Get user's won auctions
  getUserWonAuctions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { page = 1, limit = 10 } = req.query

    const result = await this.biddingService.getUserWonAuctions(
      req.userId,
      Number(page),
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Get highest bid for auction
  getHighestBid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { auctionId } = req.params
    
    if (!auctionId) {
      throw new AppError('Auction ID is required', 400)
    }
    
    const bid = await this.biddingService.getHighestBid(auctionId)

    if (!bid) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'No bids found for this auction'
      } as ApiResponse<null>)
      return
    }

    res.status(200).json({
      success: true,
      data: bid
    } as ApiResponse<Bid>)
  })

  // Check if user is highest bidder
  isHighestBidder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { auctionId } = req.params
    
    if (!auctionId) {
      throw new AppError('Auction ID is required', 400)
    }
    
    const isHighest = await this.biddingService.isHighestBidder(auctionId, req.userId)

    res.status(200).json({
      success: true,
      data: { isHighestBidder: isHighest }
    } as ApiResponse<{ isHighestBidder: boolean }>)
  })

  // Get bid statistics for auction
  getBidStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { auctionId } = req.params
    
    if (!auctionId) {
      throw new AppError('Auction ID is required', 400)
    }
    
    const stats = await this.biddingService.getBidStatistics(auctionId)

    res.status(200).json({
      success: true,
      data: stats
    } as ApiResponse<{
      totalBids: number
      uniqueBidders: number
      averageBid: number
      highestBid: number
      lowestBid: number
    }>)
  })
}