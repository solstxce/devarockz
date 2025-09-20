import { supabase } from './database'
import { CartService } from './cart'
import type { 
  Order, 
  OrderItem,
  CreateOrderRequest,
  UpdateOrderRequest,
  Address,
  ApiResponse 
} from '@/types'

export class OrderService {
  private static instance: OrderService
  private cartService: CartService

  private constructor() {
    this.cartService = CartService.getInstance()
  }

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService()
    }
    return OrderService.instance
  }

  // Create order from cart
  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order> {
    const { billing_address, shipping_address, shipping_method, payment_method, notes, discount_code } = orderData

    // Validate cart
    const cartValidation = await this.cartService.validateCart(userId)
    if (!cartValidation.valid) {
      throw new Error(`Cart validation failed: ${cartValidation.errors.join(', ')}`)
    }

    // Get cart with items
    const cart = await this.cartService.getOrCreateCart(userId)
    if (!cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty')
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const taxRate = 0.08 // 8% tax rate
    const taxAmount = subtotal * taxRate
    const shippingCost = subtotal > 50 ? 0 : 9.99 // Free shipping over $50
    let discountAmount = 0

    // Apply discount if provided
    if (discount_code) {
      const discount = await this.validateDiscount(discount_code, subtotal)
      if (discount) {
        discountAmount = this.calculateDiscountAmount(discount, subtotal, shippingCost)
      }
    }

    const totalAmount = subtotal + taxAmount + shippingCost - discountAmount

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        billing_address,
        shipping_address: shipping_address || billing_address,
        shipping_method,
        payment_method,
        payment_status: 'pending',
        notes
      })
      .select()
      .single()

    if (orderError || !order) {
      throw new Error(orderError?.message || 'Failed to create order')
    }

    // Create order items
    const orderItems = cart.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      title: item.product?.title || 'Unknown Product',
      sku: item.variant?.sku || item.product?.sku,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error(itemsError.message)
    }

    // Clear cart after successful order creation
    await this.cartService.clearCart(userId)

    // Return order with items
    return this.getOrderById(order.id, userId)
  }

  // Get order by ID
  async getOrderById(orderId: string, userId?: string): Promise<Order> {
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(id, title, images),
          variant:product_variants(id, title)
        ),
        user:users(id, full_name, email)
      `)
      .eq('id', orderId)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: order, error } = await query.single()

    if (error || !order) {
      throw new Error('Order not found')
    }

    return order
  }

  // Get orders for user
  async getUserOrders(userId: string, page = 1, limit = 20): Promise<ApiResponse<Order[]>> {
    const offset = (page - 1) * limit

    const { data: orders, error, count } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(id, title, images),
          variant:product_variants(id, title)
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  }

  // Get all orders (admin only)
  async getAllOrders(page = 1, limit = 20, status?: string): Promise<ApiResponse<Order[]>> {
    const offset = (page - 1) * limit

    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(id, title, images),
          variant:product_variants(id, title)
        ),
        user:users(id, full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: orders, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  }

  // Update order
  async updateOrder(orderId: string, updates: UpdateOrderRequest, userId?: string): Promise<Order> {
    // If userId is provided, verify ownership (for customer updates)
    if (userId) {
      const { data: existing } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single()

      if (!existing || existing.user_id !== userId) {
        throw new Error('Order not found or unauthorized')
      }
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error || !order) {
      throw new Error(error?.message || 'Failed to update order')
    }

    return this.getOrderById(orderId)
  }

  // Confirm order (payment successful)
  async confirmOrder(orderId: string, paymentTransactionId?: string): Promise<Order> {
    const updates: UpdateOrderRequest = {
      status: 'confirmed',
      payment_status: 'completed'
    }

    if (paymentTransactionId) {
      updates.payment_transaction_id = paymentTransactionId
    }

    return this.updateOrder(orderId, updates)
  }

  // Ship order
  async shipOrder(orderId: string, trackingNumber: string, shippingMethod?: string): Promise<Order> {
    const updates: UpdateOrderRequest = {
      status: 'shipped',
      tracking_number: trackingNumber,
      shipped_at: new Date().toISOString()
    }

    if (shippingMethod) {
      updates.shipping_method = shippingMethod
    }

    return this.updateOrder(orderId, updates)
  }

  // Deliver order
  async deliverOrder(orderId: string): Promise<Order> {
    return this.updateOrder(orderId, {
      status: 'delivered',
      delivered_at: new Date().toISOString()
    })
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const updates: UpdateOrderRequest = {
      status: 'cancelled'
    }

    if (reason) {
      updates.notes = reason
    }

    return this.updateOrder(orderId, updates)
  }

  // Get order statistics
  async getOrderStatistics(userId?: string): Promise<{
    total_orders: number
    total_revenue: number
    pending_orders: number
    completed_orders: number
    average_order_value: number
  }> {
    let query = supabase
      .from('orders')
      .select('status, total_amount')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: orders, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
    const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0
    const completedOrders = orders?.filter(order => ['delivered', 'completed'].includes(order.status)).length || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      average_order_value: averageOrderValue
    }
  }

  // Helper method to validate discount code
  private async validateDiscount(code: string, orderSubtotal: number): Promise<any> {
    const { data: discount, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !discount) {
      throw new Error('Invalid discount code')
    }

    // Check if discount is still valid
    const now = new Date()
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      throw new Error('Discount code is not yet active')
    }

    if (discount.ends_at && new Date(discount.ends_at) < now) {
      throw new Error('Discount code has expired')
    }

    // Check usage limits
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      throw new Error('Discount code usage limit reached')
    }

    // Check minimum order amount
    if (discount.minimum_order_amount && orderSubtotal < discount.minimum_order_amount) {
      throw new Error(`Minimum order amount of $${discount.minimum_order_amount} required for this discount`)
    }

    return discount
  }

  // Helper method to calculate discount amount
  private calculateDiscountAmount(discount: any, subtotal: number, shippingCost: number): number {
    switch (discount.type) {
      case 'percentage':
        return subtotal * (discount.value / 100)
      case 'fixed_amount':
        return Math.min(discount.value, subtotal)
      case 'free_shipping':
        return shippingCost
      default:
        return 0
    }
  }
}