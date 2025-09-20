import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Gavel, AlertTriangle, TrendingUp, Clock, History, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Auction, Bid } from '@/lib/supabase'
import { biddingService } from '@/services/biddingService'

interface EnhancedBidModalProps {
  auction: Auction | null
  isOpen: boolean
  onClose: () => void
  onConfirmBid: (bidAmount: number) => Promise<void>
  isSubmitting?: boolean
}

export function EnhancedBidModal({
  auction,
  isOpen,
  onClose,
  onConfirmBid,
  isSubmitting = false
}: EnhancedBidModalProps) {
  const [bidAmount, setBidAmount] = useState('')
  const [error, setError] = useState('')
  const [bidHistory, setBidHistory] = useState<Bid[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch bid history when modal opens
  useEffect(() => {
    const fetchBidHistory = async () => {
      if (!auction) return
      
      setLoadingHistory(true)
      try {
        const result = await biddingService.getAuctionBids(auction.id)
        if (result.success && result.data) {
          setBidHistory(result.data.slice(0, 10)) // Show last 10 bids
        }
      } catch (error) {
        console.error('Error fetching bid history:', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    if (isOpen && auction) {
      fetchBidHistory()
    }
  }, [isOpen, auction])

  if (!auction) return null

  const currentBid = auction.current_bid
  const minimumBid = currentBid + auction.bid_increment
  const enteredBid = parseFloat(bidAmount) || 0

  const validateBid = () => {
    if (!bidAmount) {
      setError('Please enter a bid amount')
      return false
    }

    if (enteredBid < minimumBid) {
      setError(`Bid must be at least $${minimumBid.toFixed(2)}`)
      return false
    }

    if (enteredBid > currentBid + 10000) {
      setError('Bid amount seems unusually high. Please verify.')
      return false
    }

    setError('')
    return true
  }

  const handleBidSubmit = async () => {
    if (!validateBid()) return

    try {
      await onConfirmBid(enteredBid)
      setBidAmount('')
      setError('')
      onClose()
    } catch {
      setError('Failed to place bid. Please try again.')
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setBidAmount('')
      setError('')
      onClose()
    }
  }

  const isBidValid = enteredBid >= minimumBid && enteredBid <= currentBid + 10000
  const bidIncrease = enteredBid - currentBid

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Gavel className="w-5 h-5 text-blue-600" />
            <span>Confirm Your Bid</span>
          </DialogTitle>
          <DialogDescription>
            Place your bid on "{auction.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Bid Form */}
          <div className="space-y-4">
            {/* Current Auction Info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Bid:</span>
                <span className="font-semibold text-lg text-green-600">
                  ${currentBid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Minimum Bid:</span>
                <span className="font-medium text-blue-600">
                  ${minimumBid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Your Bid:</span>
                <span className="font-bold text-xl text-gray-900">
                  ${enteredBid > 0 ? enteredBid.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {/* Bid Input */}
            <div className="space-y-2">
              <Label htmlFor="bidAmount">Your Bid Amount ($)</Label>
              <Input
                id="bidAmount"
                type="number"
                placeholder={`Min: $${minimumBid.toFixed(2)}`}
                value={bidAmount}
                onChange={(e) => {
                  setBidAmount(e.target.value)
                  setError('')
                }}
                min={minimumBid}
                step={auction.bid_increment}
                disabled={isSubmitting}
                className={error ? 'border-red-500' : ''}
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Bid Analysis */}
            {enteredBid > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Bid Analysis</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Increase from current:</span>
                    <span className="font-medium">+${bidIncrease.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bid increment:</span>
                    <span>${auction.bid_increment.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* High bid warning */}
            {enteredBid > currentBid + 1000 && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <strong>High bid warning:</strong> Your bid is significantly higher than the current bid. Please verify the amount.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right Column - Bid History */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Recent Bids</h3>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading bid history...</span>
              </div>
            ) : bidHistory.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {bidHistory.map((bid, index) => (
                  <div key={bid.id} className="bg-white border rounded-lg p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {bid.bidder?.full_name || 'Anonymous Bidder'}
                        </span>
                        {index === 0 && (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Highest
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold text-green-600">
                        ${bid.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}</span>
                      {bid.is_auto_bid && (
                        <Badge variant="secondary" className="text-xs">Auto Bid</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gavel className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No bids yet. Be the first!</p>
              </div>
            )}

            {/* Auction Time Remaining */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-900">Time Remaining</span>
              </div>
              <p className="text-sm text-orange-800">
                Ends {formatDistanceToNow(new Date(auction.end_time), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBidSubmit}
            disabled={!isBidValid || isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Placing Bid...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Gavel className="w-4 h-4" />
                <span>Confirm Bid ${enteredBid.toFixed(2)}</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}