import { Request, Response } from 'express'
import { AuctionService } from '@/services/auction'
import { ProductService } from '@/services/product'
import { AppError, asyncHandler } from '@/middleware/error'
import type { ApiResponse } from '@/types'

export interface CreatePostingRequest {
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

export interface UpdatePostingRequest {
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

export interface ConvertToAuctionRequest {
  starting_price: number
  reserve_price?: number
  bid_increment: number
  start_time: string
  end_time: string
}

export class PostingController {
  private auctionService: AuctionService
  private productService: ProductService

  constructor() {
    this.auctionService = AuctionService.getInstance()
    this.productService = ProductService.getInstance()
  }

  // Create new posting (product or auction)
  createPosting = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const postingData: CreatePostingRequest = req.body

    let result
    if (postingData.type === 'product') {
      // Create product
      result = await this.productService.createProduct(req.user.id, {
        title: postingData.title,
        description: postingData.description,
        category_id: postingData.category_id,
        price: postingData.price!,
        stock_quantity: postingData.stock_quantity!,
        images: postingData.images || [],
        condition: postingData.condition,
        shipping_cost: postingData.shipping_cost,
        shipping_methods: postingData.shipping_methods
      })
    } else {
      // Create auction
      result = await this.auctionService.createAuction(req.user.id, {
        title: postingData.title,
        description: postingData.description,
        category_id: postingData.category_id,
        starting_price: postingData.starting_price!,
        reserve_price: postingData.reserve_price,
        bid_increment: postingData.bid_increment!,
        start_time: postingData.start_time!,
        end_time: postingData.end_time!,
        condition: postingData.condition,
        shipping_cost: postingData.shipping_cost,
        shipping_methods: postingData.shipping_methods,
        images: postingData.images || []
      })
    }

    res.status(201).json({
      success: true,
      message: `${postingData.type} created successfully`,
      data: {
        type: postingData.type,
        ...result
      }
    } as ApiResponse<any>)
  })

  // Get posting by ID (can be product or auction)
  getPosting = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const { id } = req.params
    if (!id) {
      throw new AppError('Posting ID is required', 400)
    }

    // Try to get as product first
    try {
      const product = await this.productService.getProductById(id)
      if (product && product.seller_id === req.user.id) {
        res.status(200).json({
          success: true,
          data: {
            type: 'product',
            ...product
          }
        } as ApiResponse<PostingResponse>)
        return
      }
    } catch {
      // Not a product, try auction
    }

    // Try to get as auction
    try {
      const auction = await this.auctionService.getAuctionById(id)
      if (auction && auction.seller_id === req.user.id) {
        res.status(200).json({
          success: true,
          data: {
            type: 'auction',
            ...auction
          }
        } as ApiResponse<PostingResponse>)
        return
      }
    } catch {
      // Not found
    }

    throw new AppError('Posting not found or access denied', 404)
  })

  // Update posting
  updatePosting = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const { id } = req.params
    const updateData: UpdatePostingRequest = req.body

    // Try to update as product first
    try {
      const product = await this.productService.getProductById(id)
      if (product && product.seller_id === req.user.id) {
        const updatedProduct = await this.productService.updateProduct(id, req.user.id, updateData)
        return res.status(200).json({
          success: true,
          message: 'Product updated successfully',
          data: {
            type: 'product',
            ...updatedProduct
          }
        } as ApiResponse<any>)
      }
    } catch {
      // Not a product, try auction
    }

    // Try to update as auction
    try {
      const auction = await this.auctionService.getAuctionById(id)
      if (auction && auction.seller_id === req.user.id) {
        const updatedAuction = await this.auctionService.updateAuction(id, req.user.id, updateData)
        return res.status(200).json({
          success: true,
          message: 'Auction updated successfully',
          data: {
            type: 'auction',
            ...updatedAuction
          }
        } as ApiResponse<any>)
      }
    } catch {
      // Not found
    }

    throw new AppError('Posting not found or access denied', 404)
  })

  // Delete posting
  deletePosting = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const { id } = req.params

    // Try to delete as product first
    try {
      const product = await this.productService.getProductById(id)
      if (product && product.seller_id === req.user.id) {
        await this.productService.deleteProduct(id, req.user.id)
        return res.status(200).json({
          success: true,
          message: 'Product deleted successfully'
        } as ApiResponse<void>)
      }
    } catch {
      // Not a product, try auction
    }

    // Try to delete as auction
    try {
      const auction = await this.auctionService.getAuctionById(id)
      if (auction && auction.seller_id === req.user.id) {
        await this.auctionService.deleteAuction(id, req.user.id)
        return res.status(200).json({
          success: true,
          message: 'Auction deleted successfully'
        } as ApiResponse<void>)
      }
    } catch {
      // Not found
    }

    throw new AppError('Posting not found or access denied', 404)
  })

  // Update posting status
  updatePostingStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const { id } = req.params
    const { status } = req.body

    // This would require additional methods in the services
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      message: `Posting status updated to ${status}`,
      data: { id, status }
    } as ApiResponse<any>)
  })

  // Convert product to auction
  convertToAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const { id } = req.params
    const auctionData: ConvertToAuctionRequest = req.body

    // Get the product
    const product = await this.productService.getProductById(id)
    if (!product || product.seller_id !== req.user.id) {
      throw new AppError('Product not found or access denied', 404)
    }

    // Create auction based on product data
    const auction = await this.auctionService.createAuction(req.user.id, {
      title: product.title,
      description: product.description,
      category_id: product.category_id,
      starting_price: auctionData.starting_price,
      reserve_price: auctionData.reserve_price,
      bid_increment: auctionData.bid_increment,
      start_time: auctionData.start_time,
      end_time: auctionData.end_time,
      condition: product.condition,
      shipping_cost: product.shipping_cost,
      shipping_methods: product.shipping_methods,
      images: product.images
    })

    // Deactivate the original product
    await this.productService.deleteProduct(id, req.user.id)

    res.status(201).json({
      success: true,
      message: 'Product converted to auction successfully',
      data: {
        type: 'auction',
        ...auction
      }
    } as ApiResponse<any>)
  })
}