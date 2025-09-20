import { Request, Response } from 'express'
import { CartService } from '@/services/cart'
import { AppError, asyncHandler } from '@/middleware/error'
import type { 
  ShoppingCart, 
  AddToCartRequest, 
  UpdateCartItemRequest,
  ApiResponse 
} from '@/types'

export class CartController {
  private cartService: CartService

  constructor() {
    this.cartService = CartService.getInstance()
  }

  // Get user's cart
  getCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const cart = await this.cartService.getOrCreateCart(req.userId)

    res.status(200).json({
      success: true,
      data: cart
    } as ApiResponse<ShoppingCart>)
  })

  // Add item to cart
  addToCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const itemData: AddToCartRequest = req.body

    if (!itemData.product_id || !itemData.quantity || itemData.quantity <= 0) {
      throw new AppError('Product ID and valid quantity are required', 400)
    }

    const cart = await this.cartService.addToCart(req.userId, itemData)

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart
    } as ApiResponse<ShoppingCart>)
  })

  // Update cart item
  updateCartItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { itemId } = req.params
    const updates: UpdateCartItemRequest = req.body

    if (!itemId) {
      throw new AppError('Cart item ID is required', 400)
    }

    if (!updates.quantity || updates.quantity < 0) {
      throw new AppError('Valid quantity is required', 400)
    }

    const cart = await this.cartService.updateCartItem(req.userId, itemId, updates)

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: cart
    } as ApiResponse<ShoppingCart>)
  })

  // Remove item from cart
  removeCartItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { itemId } = req.params

    if (!itemId) {
      throw new AppError('Cart item ID is required', 400)
    }

    const cart = await this.cartService.removeCartItem(req.userId, itemId)

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    } as ApiResponse<ShoppingCart>)
  })

  // Clear cart
  clearCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    await this.cartService.clearCart(req.userId)

    res.status(200).json({
      success: true,
      message: 'Cart cleared'
    } as ApiResponse)
  })

  // Get cart summary
  getCartSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const summary = await this.cartService.getCartSummary(req.userId)

    res.status(200).json({
      success: true,
      data: summary
    } as ApiResponse)
  })

  // Validate cart
  validateCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const validation = await this.cartService.validateCart(req.userId)

    res.status(200).json({
      success: true,
      data: validation
    } as ApiResponse)
  })
}