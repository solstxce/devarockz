import { useEffect, useRef } from 'react'
import { useRealTime } from './useRealTime'
import type { Auction, Bid } from '@/lib/supabase'

interface UseAuctionRealTimeOptions {
  auctionId?: string
  onBidUpdate?: (auction: Auction) => void
  onNewBid?: (bid: Bid) => void
  onAuctionEnd?: (auction: Auction) => void
}

export function useAuctionRealTime({
  auctionId,
  onBidUpdate,
  onNewBid,
  onAuctionEnd
}: UseAuctionRealTimeOptions) {
  const { subscribe, unsubscribe, socket } = useRealTime()
  const currentAuctionId = useRef<string | null>(null)

  // Join auction room when auctionId changes
  useEffect(() => {
    if (socket && auctionId && auctionId !== currentAuctionId.current) {
      // Leave previous room if exists
      if (currentAuctionId.current) {
        socket.emit('leave_auction', currentAuctionId.current)
      }
      
      // Join new room
      socket.emit('join_auction', auctionId)
      currentAuctionId.current = auctionId
      
      console.log(`Joined auction room: ${auctionId}`)
    }
    
    return () => {
      if (socket && currentAuctionId.current) {
        socket.emit('leave_auction', currentAuctionId.current)
        currentAuctionId.current = null
      }
    }
  }, [socket, auctionId])

  // Set up event listeners
  useEffect(() => {
    if (!auctionId) return

    const handleBidUpdate = (...args: unknown[]) => {
      const auction = args[0] as Auction
      if (auction.id === auctionId) {
        onBidUpdate?.(auction)
      }
    }

    const handleNewBid = (...args: unknown[]) => {
      const bid = args[0] as Bid
      if (bid.auction_id === auctionId) {
        onNewBid?.(bid)
      }
    }

    const handleAuctionEnd = (...args: unknown[]) => {
      const auction = args[0] as Auction
      if (auction.id === auctionId) {
        onAuctionEnd?.(auction)
      }
    }

    // Subscribe to auction-specific events
    subscribe(`auction_updated_${auctionId}`, handleBidUpdate)
    subscribe(`bid_placed_${auctionId}`, handleNewBid)
    subscribe(`auction_ended_${auctionId}`, handleAuctionEnd)

    return () => {
      unsubscribe(`auction_updated_${auctionId}`)
      unsubscribe(`bid_placed_${auctionId}`)
      unsubscribe(`auction_ended_${auctionId}`)
    }
  }, [auctionId, onBidUpdate, onNewBid, onAuctionEnd, subscribe, unsubscribe])

  return {
    isConnected: !!socket?.connected,
    joinAuction: (id: string) => {
      if (socket) {
        socket.emit('join_auction', id)
      }
    },
    leaveAuction: (id: string) => {
      if (socket) {
        socket.emit('leave_auction', id)
      }
    }
  }
}