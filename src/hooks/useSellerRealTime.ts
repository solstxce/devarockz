import { useEffect, useCallback } from 'react'
import { useRealTime } from '@/hooks/useRealTime'
import { useSellerAuth } from '@/hooks/useSellerAuth'

interface SellerStats {
  total_products: number
  active_products: number
  total_auctions: number
  active_auctions: number
  total_orders: number
  total_revenue: number
  pending_orders: number
}

interface SellerNotification {
  id: string
  seller_id: string
  type: string
  title: string
  message: string
  auction_id?: string
  is_read: boolean
  created_at: string
}

export interface SellerDashboardCallbacks {
  onStatsUpdated?: (stats: SellerStats | null) => void
  onListingUpdated?: (listing: unknown, type: 'product' | 'auction') => void
  onNewBid?: (notification: SellerNotification) => void
  onNotification?: (notification: SellerNotification) => void
}

export function useSellerRealTime(callbacks: SellerDashboardCallbacks = {}) {
  const { socket, subscribe, unsubscribe, joinRoom, leaveRoom } = useRealTime()
  const { getSellerUser } = useSellerAuth()
  const sellerAuth = getSellerUser()

  // Handle seller stats updates
  const handleStatsUpdated = useCallback((...args: unknown[]) => {
    const event = args[0] as { seller_id: string; stats: SellerStats }
    console.log('[SellerRealTime] Stats updated:', event)
    callbacks.onStatsUpdated?.(event.stats)
  }, [callbacks])

  // Handle listing updates
  const handleListingUpdated = useCallback((...args: unknown[]) => {
    const event = args[0] as { seller_id: string; listing: unknown; type: 'product' | 'auction' }
    console.log('[SellerRealTime] Listing updated:', event)
    callbacks.onListingUpdated?.(event.listing, event.type)
  }, [callbacks])

  // Handle seller notifications
  const handleSellerNotification = useCallback((...args: unknown[]) => {
    const event = args[0] as { seller_id: string; notification: SellerNotification }
    console.log('[SellerRealTime] Seller notification:', event)
    if (event.notification.type === 'new_bid') {
      callbacks.onNewBid?.(event.notification)
    }
    callbacks.onNotification?.(event.notification)
  }, [callbacks])

  // Handle bid placed events (for seller auctions)
  const handleBidPlaced = useCallback((...args: unknown[]) => {
    const event = args[0] as { auction_id: string; bid: unknown; auction: unknown }
    console.log('[SellerRealTime] Bid placed on seller auction:', event)
    // This will trigger through seller notification, but we can also handle directly
    callbacks.onStatsUpdated?.(null) // Signal to refetch stats
  }, [callbacks])

  useEffect(() => {
    if (!socket || !sellerAuth) return

    const sellerId = sellerAuth.user.id

    // Join seller-specific room
    joinRoom(`seller_${sellerId}`)

    // Subscribe to seller events
    subscribe('seller_stats_updated', handleStatsUpdated)
    subscribe('seller_listing_updated', handleListingUpdated)
    subscribe('seller_notification', handleSellerNotification)
    subscribe('bid_placed', handleBidPlaced)

    return () => {
      // Unsubscribe from events
      unsubscribe('seller_stats_updated', handleStatsUpdated)
      unsubscribe('seller_listing_updated', handleListingUpdated)
      unsubscribe('seller_notification', handleSellerNotification)
      unsubscribe('bid_placed', handleBidPlaced)

      // Leave seller room
      leaveRoom(`seller_${sellerId}`)
    }
  }, [
    socket,
    sellerAuth,
    joinRoom,
    leaveRoom,
    subscribe,
    unsubscribe,
    handleStatsUpdated,
    handleListingUpdated,
    handleSellerNotification,
    handleBidPlaced
  ])

  return {
    isConnected: socket?.connected || false,
    sellerId: sellerAuth?.user.id
  }
}