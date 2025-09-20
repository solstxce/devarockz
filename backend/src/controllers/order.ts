import { Request, Response } from 'express'
import { OrderService } from '@/services/order'
import { AppError, asyncHandler } from '@/middleware/error'
import type { 
  Order, 
  CreateOrderRequest, 
  UpdateOrderRequest,
  ApiResponse 
} from '@/types'

export class OrderController {
  private orderService: OrderService

  constructor() {
    this.orderService = OrderService.getInstance()
  }

  // Create order from cart
  createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const orderData: CreateOrderRequest = req.body

    if (!orderData.billing_address || !orderData.payment_method) {
      throw new AppError('Billing address and payment method are required', 400)
    }

    const order = await this.orderService.createOrder(req.userId, orderData)

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    } as ApiResponse<Order>)
  })

  // Get order by ID
  getOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params

    if (!id) {
      throw new AppError('Order ID is required', 400)
    }

    const order = await this.orderService.getOrderById(id, req.userId)

    res.status(200).json({
      success: true,
      data: order
    } as ApiResponse<Order>)
  })

  // Get user's orders
  getUserOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { page = 1, limit = 20 } = req.query

    const result = await this.orderService.getUserOrders(
      req.userId,
      Number(page),
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Get all orders (admin only)
  getAllOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Admin access required', 403)
    }

    const { page = 1, limit = 20, status } = req.query

    const result = await this.orderService.getAllOrders(
      Number(page),
      Number(limit),
      status as string
    )

    res.status(200).json(result)
  })

  // Update order (admin only)
  updateOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Admin access required', 403)
    }

    const { id } = req.params
    const updates: UpdateOrderRequest = req.body

    if (!id) {
      throw new AppError('Order ID is required', 400)
    }

    const order = await this.orderService.updateOrder(id, updates)

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    } as ApiResponse<Order>)
  })

  // Confirm order (payment webhook)
  confirmOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const { payment_transaction_id } = req.body

    if (!id) {
      throw new AppError('Order ID is required', 400)
    }

    const order = await this.orderService.confirmOrder(id, payment_transaction_id)

    res.status(200).json({
      success: true,
      message: 'Order confirmed successfully',
      data: order
    } as ApiResponse<Order>)
  })

  // Ship order (admin/seller only)
  shipOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !['admin', 'seller'].includes(req.user.role)) {
      throw new AppError('Admin or seller access required', 403)
    }

    const { id } = req.params
    const { tracking_number, shipping_method } = req.body

    if (!id) {
      throw new AppError('Order ID is required', 400)
    }

    if (!tracking_number) {
      throw new AppError('Tracking number is required', 400)
    }

    const order = await this.orderService.shipOrder(id, tracking_number, shipping_method)

    res.status(200).json({
      success: true,
      message: 'Order shipped successfully',
      data: order
    } as ApiResponse<Order>)
  })

  // Deliver order (admin only)
  deliverOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Admin access required', 403)
    }

    const { id } = req.params

    if (!id) {
      throw new AppError('Order ID is required', 400)
    }

    const order = await this.orderService.deliverOrder(id)

    res.status(200).json({
      success: true,
      message: 'Order delivered successfully',
      data: order
    } as ApiResponse<Order>)
  })

  // Cancel order
  cancelOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params
    const { reason } = req.body

    if (!id) {
      throw new AppError('Order ID is required', 400)
    }

    // Allow users to cancel their own orders, or admins to cancel any order
    const isAdmin = req.user?.role === 'admin'
    const order = await this.orderService.cancelOrder(id, reason)

    // If not admin, verify ownership
    if (!isAdmin) {
      if (order.user_id !== req.userId) {
        throw new AppError('Not authorized to cancel this order', 403)
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    } as ApiResponse<Order>)
  })

  // Get order statistics
  getOrderStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    // Users can only see their own stats, admins can see all
    const userId = req.user?.role === 'admin' ? undefined : req.userId
    const stats = await this.orderService.getOrderStatistics(userId)

    res.status(200).json({
      success: true,
      data: stats
    } as ApiResponse)
  })
}