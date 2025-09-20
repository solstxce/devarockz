import { useState } from 'react'
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
import { Gavel, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import type { Auction } from '@/lib/supabase'

interface BidConfirmationModalProps {
  auction: Auction | null
  isOpen: boolean
  onClose: () => void
  onConfirmBid: (bidAmount: number) => Promise<void>
  isSubmitting?: boolean
}

export function BidConfirmationModal({
  auction,
  isOpen,
  onClose,
  onConfirmBid,
  isSubmitting = false
}: BidConfirmationModalProps) {
  const [bidAmount, setBidAmount] = useState('')
  const [error, setError] = useState('')

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Gavel className="w-5 h-5 text-blue-600" />
            <span>Confirm Your Bid</span>
          </DialogTitle>
          <DialogDescription>
            Place your bid on "{auction.title}"
          </DialogDescription>
        </DialogHeader>

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
              <span className="text-sm text-gray-600">Your Max Bid:</span>
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
          {enteredBid > 0 && isBidValid && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Bid Analysis</span>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• You're bidding ${bidIncrease.toFixed(2)} above current bid</div>
                <div>• This is {((bidIncrease / auction.bid_increment)).toFixed(1)}x the minimum increment</div>
                <div>• Winning chance: {enteredBid > currentBid * 1.1 ? 'High' : enteredBid > currentBid * 1.05 ? 'Medium' : 'Low'}</div>
              </div>
            </div>
          )}

          {/* Time Warning */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Time sensitive:</strong> This auction may end soon. Other bidders might place bids while you're deciding.
            </AlertDescription>
          </Alert>

          {/* High Bid Warning */}
          {enteredBid > currentBid * 2 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>High bid warning:</strong> Your bid is significantly higher than the current bid. Please verify the amount.
              </AlertDescription>
            </Alert>
          )}
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