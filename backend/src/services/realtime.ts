import { Server as SocketIOServer } from 'socket.io'
import type { 
  SocketEvents,
  Product,
  Order,
  ShoppingCart,
  Notification,
  Bid,
  Auction
} from '@/types'

export class RealTimeService {
  private static instance: RealTimeService
  private io: SocketIOServer | null = null

  private constructor() {}

  public static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService()
    }
    return RealTimeService.instance
  }

  // Initialize with Socket.IO server instance
  public initialize(io: SocketIOServer): void {
    this.io = io
  }

  // Auction Events
  public emitBidPlaced(auctionId: string, bid: Bid, auction: Auction): void {
    if (!this.io) return

    const event: SocketEvents['bid_placed'] = {
      auction_id: auctionId,
      bid,
      auction
    }

    // Notify all users watching this auction
    this.io.to(`auction_${auctionId}`).emit('bid_placed', event)

    // Notify the seller of the auction about the new bid
    if (auction.seller_id) {
      this.emitSellerNotification(auction.seller_id, {
        id: '',
        seller_id: auction.seller_id,
        type: 'new_bid',
        title: 'New Bid Received',
        message: `New bid of $${bid.amount} placed on "${auction.title}"`,
        auction_id: auctionId,
        is_read: false,
        created_at: new Date().toISOString()
      })
    }

    // Notify the previous highest bidder that they've been outbid
    if (bid.bidder_id !== auction.winner_id && auction.winner_id) {
      this.io.to(`user_${auction.winner_id}`).emit('outbid_notification', {
        user_id: auction.winner_id,
        auction_id: auctionId,
        new_bid: bid
      })
    }
  }

  public emitAuctionEnded(auctionId: string, auction: Auction): void {
    if (!this.io) return

    const event: SocketEvents['auction_ended'] = {
      auction_id: auctionId,
      auction
    }

    // Notify all users watching this auction
    this.io.to(`auction_${auctionId}`).emit('auction_ended', event)

    // Notify winner if there is one
    if (auction.winner_id) {
      this.io.to(`user_${auction.winner_id}`).emit('notification', {
        user_id: auction.winner_id,
        notification: {
          id: '',
          user_id: auction.winner_id,
          type: 'auction_won',
          title: 'Auction Won!',
          message: `Congratulations! You won the auction for "${auction.title}"`,
          auction_id: auctionId,
          is_read: false,
          created_at: new Date().toISOString()
        }
      })
    }
  }

  public emitAuctionUpdated(auctionId: string, auction: Auction): void {
    if (!this.io) return

    const event: SocketEvents['auction_updated'] = {
      auction_id: auctionId,
      auction
    }

    this.io.to(`auction_${auctionId}`).emit('auction_updated', event)
  }

  // Product Events
  public emitProductUpdated(productId: string, product: Product): void {
    if (!this.io) return

    const event: SocketEvents['product_updated'] = {
      product_id: productId,
      product
    }

    // Notify users watching this product
    this.io.to(`product_${productId}`).emit('product_updated', event)

    // Notify users watching this category
    if (product.category_id) {
      this.io.to(`category_${product.category_id}`).emit('product_updated', event)
    }
  }

  public emitProductStockChanged(
    productId: string, 
    variantId: string | undefined, 
    oldStock: number, 
    newStock: number
  ): void {
    if (!this.io) return

    const event: SocketEvents['product_stock_changed'] = {
      product_id: productId,
      old_stock: oldStock,
      new_stock: newStock,
      ...(variantId && { variant_id: variantId })
    }

    this.io.to(`product_${productId}`).emit('product_stock_changed', event)

    // If stock is low or out of stock, notify interested users
    if (newStock <= 5) {
      this.io.emit('low_stock_alert', event)
    }
  }

  public emitProductPriceChanged(
    productId: string,
    variantId: string | undefined,
    oldPrice: number,
    newPrice: number
  ): void {
    if (!this.io) return

    const event: SocketEvents['product_price_changed'] = {
      product_id: productId,
      old_price: oldPrice,
      new_price: newPrice,
      ...(variantId && { variant_id: variantId })
    }

    this.io.to(`product_${productId}`).emit('product_price_changed', event)
  }

  // Order Events
  public emitOrderStatusUpdated(
    orderId: string,
    order: Order,
    oldStatus: string,
    newStatus: string
  ): void {
    if (!this.io) return

    const event: SocketEvents['order_status_updated'] = {
      order_id: orderId,
      order,
      old_status: oldStatus,
      new_status: newStatus
    }

    // Notify the customer
    this.io.to(`user_${order.user_id}`).emit('order_status_updated', event)

    // Create notification based on status
    let notificationMessage = ''
    let notificationType: Notification['type'] = 'order_confirmed'

    switch (newStatus) {
      case 'confirmed':
        notificationMessage = `Your order #${order.order_number} has been confirmed!`
        notificationType = 'order_confirmed'
        break
      case 'shipped':
        notificationMessage = `Your order #${order.order_number} has been shipped!`
        notificationType = 'order_shipped'
        break
      case 'delivered':
        notificationMessage = `Your order #${order.order_number} has been delivered!`
        break
      case 'cancelled':
        notificationMessage = `Your order #${order.order_number} has been cancelled.`
        break
    }

    if (notificationMessage) {
      this.emitNotification(order.user_id, {
        id: '',
        user_id: order.user_id,
        type: notificationType,
        title: 'Order Update',
        message: notificationMessage,
        order_id: orderId,
        is_read: false,
        created_at: new Date().toISOString()
      })
    }
  }

  public emitOrderShipped(orderId: string, order: Order, trackingNumber: string): void {
    if (!this.io) return

    const event: SocketEvents['order_shipped'] = {
      order_id: orderId,
      order,
      tracking_number: trackingNumber
    }

    this.io.to(`user_${order.user_id}`).emit('order_shipped', event)
  }

  // Cart Events
  public emitCartUpdated(userId: string, cart: ShoppingCart): void {
    if (!this.io) return

    const event: SocketEvents['cart_updated'] = {
      user_id: userId,
      cart
    }

    this.io.to(`user_${userId}`).emit('cart_updated', event)
  }

  // Seller Dashboard Events
  public emitSellerStatsUpdated(sellerId: string, stats: any): void {
    if (!this.io) return

    const event = {
      seller_id: sellerId,
      stats
    }

    // Notify the specific seller
    this.io.to(`user_${sellerId}`).emit('seller_stats_updated', event)
    this.io.to(`seller_${sellerId}`).emit('seller_stats_updated', event)
  }

  public emitSellerListingUpdated(sellerId: string, listing: any, type: 'product' | 'auction'): void {
    if (!this.io) return

    const event = {
      seller_id: sellerId,
      listing,
      type
    }

    // Notify the specific seller
    this.io.to(`user_${sellerId}`).emit('seller_listing_updated', event)
    this.io.to(`seller_${sellerId}`).emit('seller_listing_updated', event)
  }

  public emitSellerNotification(sellerId: string, notification: any): void {
    if (!this.io) return

    const event = {
      seller_id: sellerId,
      notification
    }

    // Notify the specific seller
    this.io.to(`user_${sellerId}`).emit('seller_notification', event)
    this.io.to(`seller_${sellerId}`).emit('seller_notification', event)
  }

  // General Notifications
  public emitNotification(userId: string, notification: Notification): void {
    if (!this.io) return

    const event: SocketEvents['notification'] = {
      user_id: userId,
      notification
    }

    this.io.to(`user_${userId}`).emit('notification', event)
  }

  // Broadcast to all connected users
  public broadcast(event: string, data: any): void {
    if (!this.io) return
    this.io.emit(event, data)
  }

  // Send to specific room
  public emitToRoom(room: string, event: string, data: any): void {
    if (!this.io) return
    this.io.to(room).emit(event, data)
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    if (!this.io) return 0
    return this.io.engine.clientsCount
  }

  // Get users in specific room
  public async getUsersInRoom(room: string): Promise<string[]> {
    if (!this.io) return []
    
    try {
      const sockets = await this.io.in(room).fetchSockets()
      return sockets.map(socket => socket.id)
    } catch {
      return []
    }
  }
}