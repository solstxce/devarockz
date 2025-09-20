import { Request, Response } from 'express'
import { AuctionService } from '@/services/auction'
import { AppError, asyncHandler } from '@/middleware/error'
import type { 
  Auction, 
  CreateAuctionRequest, 
  SearchFiltersRequest, 
  ApiResponse 
} from '@/types'

export class AuctionController {
  private auctionService: AuctionService

  constructor() {
    this.auctionService = AuctionService.getInstance()
  }

  // Create new auction
  createAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    // Handle both JSON and multipart/form-data
    let auctionData: CreateAuctionRequest
    let imageFiles: Express.Multer.File[] = []

    if (req.body && Object.keys(req.body).length > 0) {
      // JSON data
      auctionData = req.body
    } else if (req.body && typeof req.body === 'object') {
      // Form data - need to parse fields
      const shippingMethodsRaw = req.body.shipping_methods || '["standard"]'
      console.log('Raw shipping_methods from form:', shippingMethodsRaw)
      let shippingMethods: string[]
      try {
        shippingMethods = JSON.parse(shippingMethodsRaw)
        console.log('Parsed shipping_methods:', shippingMethods)
        // Ensure it's an array
        if (!Array.isArray(shippingMethods)) {
          shippingMethods = [shippingMethods]
        }
        console.log('Final shipping_methods array:', shippingMethods)
      } catch (error) {
        console.error('Error parsing shipping_methods:', error)
        shippingMethods = ['standard']
      }

      auctionData = {
        title: req.body.title,
        description: req.body.description,
        category_id: req.body.category_id,
        starting_price: parseFloat(req.body.starting_price),
        bid_increment: parseFloat(req.body.bid_increment),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        condition: req.body.condition,
        shipping_cost: parseFloat(req.body.shipping_cost || 0),
        shipping_methods: shippingMethods
      }
      imageFiles = req.files as Express.Multer.File[]
    } else {
      throw new AppError('No auction data provided', 400)
    }

    // Add image file paths to auction data if files were uploaded
    if (imageFiles && imageFiles.length > 0) {
      const imagePaths = imageFiles.map(file => `/uploads/${file.filename}`)
      ;(auctionData as any).images = imagePaths
    }

    const auction = await this.auctionService.createAuction(req.userId, auctionData)

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: auction
    } as ApiResponse<Auction>)
  })

  // Get auction by ID
  getAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    
    if (!id) {
      throw new AppError('Auction ID is required', 400)
    }
    
    const auction = await this.auctionService.getAuctionById(id)

    if (!auction) {
      throw new AppError('Auction not found', 404)
    }

    res.status(200).json({
      success: true,
      data: auction
    } as ApiResponse<Auction>)
  })

  // Search auctions
  searchAuctions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters: SearchFiltersRequest = (req as any).validatedQuery || req.query
    const result = await this.auctionService.searchAuctions(filters)

    res.status(200).json(result)
  })

  // Get auctions by seller
  getSellerAuctions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { page = 1, limit = 20 } = req.query
    const result = await this.auctionService.getAuctionsBySeller(
      req.userId, 
      Number(page), 
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Get auctions by specific seller (for public viewing)
  getAuctionsBySeller = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sellerId } = req.params
    const { page = 1, limit = 20 } = req.query
    
    if (!sellerId) {
      throw new AppError('Seller ID is required', 400)
    }
    
    const result = await this.auctionService.getAuctionsBySeller(
      sellerId, 
      Number(page), 
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Update auction
  updateAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params
    const updates = req.body

    if (!id) {
      throw new AppError('Auction ID is required', 400)
    }

    const auction = await this.auctionService.updateAuction(id, req.userId, updates)

    res.status(200).json({
      success: true,
      message: 'Auction updated successfully',
      data: auction
    } as ApiResponse<Auction>)
  })

  // Delete auction
  deleteAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params
    
    if (!id) {
      throw new AppError('Auction ID is required', 400)
    }
    
    await this.auctionService.deleteAuction(id, req.userId)

    res.status(200).json({
      success: true,
      message: 'Auction deleted successfully'
    } as ApiResponse)
  })

  // Activate auction (change status from draft to active)
  activateAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params
    
    if (!id) {
      throw new AppError('Auction ID is required', 400)
    }
    
    const auction = await this.auctionService.activateAuction(id, req.userId)

    res.status(200).json({
      success: true,
      message: 'Auction activated successfully',
      data: auction
    } as ApiResponse<Auction>)
  })

  // End auction manually
  endAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params
    
    if (!id) {
      throw new AppError('Auction ID is required', 400)
    }
    
    // First check if user owns the auction
    const auction = await this.auctionService.getAuctionById(id)
    if (!auction) {
      throw new AppError('Auction not found', 404)
    }

    if (auction.seller_id !== req.userId && req.user?.role !== 'admin') {
      throw new AppError('Not authorized to end this auction', 403)
    }

    const endedAuction = await this.auctionService.endAuction(id)

    res.status(200).json({
      success: true,
      message: 'Auction ended successfully',
      data: endedAuction
    } as ApiResponse<Auction>)
  })

  // Get featured auctions
  getFeaturedAuctions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { limit = 6 } = req.query
    const auctions = await this.auctionService.getFeaturedAuctions(Number(limit))

    res.status(200).json({
      success: true,
      data: auctions
    } as ApiResponse<Auction[]>)
  })

  // Get ending auctions (for automated processing)
  getEndingAuctions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // This endpoint should be protected and only accessible by admin or system
    if (req.user?.role !== 'admin') {
      throw new AppError('Not authorized', 403)
    }

    const auctions = await this.auctionService.getEndingAuctions()

    res.status(200).json({
      success: true,
      data: auctions
    } as ApiResponse<Auction[]>)
  })
}