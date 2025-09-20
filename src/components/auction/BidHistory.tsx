import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Clock, TrendingUp } from 'lucide-react'
import { biddingService } from '@/services/biddingService'
import type { Bid } from '@/lib/supabase'

interface BidHistoryProps {
  auctionId: string
  currentBid: number
}

interface BidWithUser extends Bid {
  user?: {
    id: string
    full_name?: string
    avatar_url?: string
  }
}

export function BidHistory({ auctionId, currentBid }: BidHistoryProps) {
  const [bids, setBids] = useState<BidWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await biddingService.getAuctionBids(auctionId)

        if (result.success && result.data) {
          // Sort bids by amount descending (highest first) and add user info
          const sortedBids = result.data
            .sort((a, b) => b.amount - a.amount)
            .map(bid => ({
              ...bid,
              user: {
                id: bid.bidder_id || `user-${bid.id}`,
                full_name: bid.bidder_name || `Bidder ${bid.id.slice(0, 8)}`,
                avatar_url: bid.bidder_avatar
              }
            }))
          setBids(sortedBids)
        } else {
          setError(result.error || 'Failed to fetch bid history')
        }
      } catch (err) {
        setError('Failed to load bid history')
        console.error('Error fetching bid history:', err)
      } finally {
        setLoading(false)
      }
    }

    if (auctionId) {
      fetchBids()
    }
  }, [auctionId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Bid History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Bid History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <p>Unable to load bid history</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (bids.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Bid History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <p>No bids yet</p>
            <p className="text-sm mt-1">Be the first to place a bid!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Bid History</span>
          </div>
          <Badge variant="secondary">{bids.length} bids</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bids.map((bid, index) => {
            const isWinning = bid.amount === currentBid
            const isHighest = index === 0

            return (
              <div
                key={bid.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  isWinning ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={bid.user?.avatar_url} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {bid.user?.full_name || 'Anonymous'}
                      </span>
                      {isWinning && (
                        <Badge variant="default" className="text-xs">
                          Current Winner
                        </Badge>
                      )}
                      {isHighest && !isWinning && (
                        <Badge variant="secondary" className="text-xs">
                          Highest Bid
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        isWinning ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        ${bid.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                    </span>
                    {bid.is_auto_bid && (
                      <Badge variant="outline" className="text-xs">
                        Auto Bid
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}