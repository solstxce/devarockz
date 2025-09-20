import { useState } from 'react'
import { Gavel, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Auction } from '@/lib/supabase'

interface BiddingFormProps {
  auction: Auction
  onPlaceBid: (amount: number, isAutoBid?: boolean, maxAutoBid?: number) => Promise<void>
  userBids?: Array<{ amount: number; created_at: string }>
  isLoading?: boolean
}

export function BiddingForm({ auction, onPlaceBid, userBids = [], isLoading = false }: BiddingFormProps) {
  const [bidAmount, setBidAmount] = useState<string>('')
  const [autoBidEnabled, setAutoBidEnabled] = useState(false)
  const [maxAutoBid, setMaxAutoBid] = useState<string>('')
  const [error, setError] = useState<string>('')

  const minBidAmount = auction.current_bid + auction.bid_increment
  const userHighestBid = userBids.length > 0 ? Math.max(...userBids.map(b => b.amount)) : 0
  const isUserHighestBidder = userHighestBid === auction.current_bid

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const bidValue = parseFloat(bidAmount)
    const maxAutoBidValue = autoBidEnabled ? parseFloat(maxAutoBid) : undefined

    // Validation
    if (isNaN(bidValue) || bidValue < minBidAmount) {
      setError(`Bid must be at least $${minBidAmount.toFixed(2)}`)
      return
    }

    if (autoBidEnabled && (isNaN(maxAutoBidValue!) || maxAutoBidValue! <= bidValue)) {
      setError('Maximum auto-bid must be higher than current bid')
      return
    }

    try {
      await onPlaceBid(bidValue, autoBidEnabled, maxAutoBidValue)
      setBidAmount('')
      setMaxAutoBid('')
      setAutoBidEnabled(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid')
    }
  }

  const quickBidAmounts = [
    minBidAmount,
    minBidAmount + auction.bid_increment,
    minBidAmount + (auction.bid_increment * 2),
    minBidAmount + (auction.bid_increment * 5)
  ]

  const isAuctionActive = auction.status === 'active' && new Date(auction.end_time) > new Date()

  if (!isAuctionActive) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500 mb-4">
            <Clock className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Auction Ended</p>
            <p className="text-sm">This auction is no longer accepting bids</p>
          </div>
          {auction.winner_id && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Winner: ${auction.current_bid.toFixed(2)}
            </Badge>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Gavel className="w-5 h-5 text-blue-600" />
          <span>Place Your Bid</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Current Bid</p>
            <p className="text-2xl font-bold text-green-600">${auction.current_bid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Minimum Bid</p>
            <p className="text-xl font-semibold text-gray-900">${minBidAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* User Status */}
        {userBids.length > 0 && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Highest Bid</p>
                <p className="text-lg font-semibold">${userHighestBid.toFixed(2)}</p>
              </div>
              <Badge variant={isUserHighestBidder ? 'default' : 'secondary'}>
                {isUserHighestBidder ? 'Leading' : 'Outbid'}
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Bid Buttons */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Bid</Label>
          <div className="grid grid-cols-2 gap-2">
            {quickBidAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setBidAmount(amount.toFixed(2))}
                className="text-sm"
              >
                ${amount.toFixed(2)}
              </Button>
            ))}
          </div>
        </div>

        {/* Bid Form */}
        <form onSubmit={handleBidSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bidAmount">Bid Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="bidAmount"
                type="number"
                step="0.01"
                min={minBidAmount}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={minBidAmount.toFixed(2)}
                className="pl-8"
                required
              />
            </div>
          </div>

          {/* Auto-bid Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoBid"
                checked={autoBidEnabled}
                onChange={(e) => setAutoBidEnabled(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="autoBid" className="flex items-center space-x-2 cursor-pointer">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Enable Auto-bidding</span>
              </Label>
            </div>
            
            {autoBidEnabled && (
              <div>
                <Label htmlFor="maxAutoBid" className="text-sm">Maximum Auto-bid Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="maxAutoBid"
                    type="number"
                    step="0.01"
                    value={maxAutoBid}
                    onChange={(e) => setMaxAutoBid(e.target.value)}
                    placeholder="Enter maximum amount"
                    className="pl-8"
                    required={autoBidEnabled}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll automatically bid on your behalf up to this amount
                </p>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={isLoading}
          >
            {isLoading ? (
              'Placing Bid...'
            ) : (
              <>
                <Gavel className="w-4 h-4 mr-2" />
                Place Bid - ${bidAmount || minBidAmount.toFixed(2)}
              </>
            )}
          </Button>
        </form>

        {/* Bid History */}
        {userBids.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Your Recent Bids</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {userBids.slice(0, 5).map((bid, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span>${bid.amount.toFixed(2)}</span>
                  <span className="text-gray-500">{new Date(bid.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}