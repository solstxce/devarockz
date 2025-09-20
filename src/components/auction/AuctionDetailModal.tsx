import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Clock,
  Gavel,
  Heart,
  MapPin,
  Package,
  Shield,
  Star,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  Share2
} from 'lucide-react'
import { BidHistory } from './BidHistory'
import type { Auction } from '@/lib/supabase'

interface AuctionDetailModalProps {
  auction: Auction | null
  isOpen: boolean
  onClose: () => void
  onBidClick: (auction: Auction) => void
  onWatchlistToggle: (auctionId: string) => void
  isWatched?: boolean
}

export function AuctionDetailModal({
  auction,
  isOpen,
  onClose,
  onBidClick,
  onWatchlistToggle,
  isWatched = false
}: AuctionDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)

  if (!auction) return null

  const timeRemaining = formatDistanceToNow(new Date(auction.end_time), { addSuffix: true })
  const isActive = auction.status === 'active' && new Date(auction.end_time) > new Date()
  const hasImages = auction.images && auction.images.length > 0
  const images = hasImages ? auction.images : []

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
      setImageError(false)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
      setImageError(false)
    }
  }

  const handleBidClick = () => {
    onBidClick(auction)
  }

  const handleWatchlistClick = () => {
    onWatchlistToggle(auction.id)
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: auction.title,
        text: `Check out this auction: ${auction.title}`,
        url: window.location.href
      })
    } catch {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0" style={{ width: '95vw', maxWidth: 'none' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-gray-100">
            {hasImages && !imageError ? (
              <div className="relative aspect-square">
                <img
                  src={images[currentImageIndex]}
                  alt={`${auction.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    {/* Image indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <Package className="w-24 h-24 text-gray-400" />
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4">
              <div className="flex items-start justify-between">
                <DialogTitle className="text-xl font-bold text-gray-900 leading-tight pr-4">
                  {auction.title}
                </DialogTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWatchlistClick}
                    className={`${isWatched ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}`}
                  >
                    <Heart className={`w-4 h-4 ${isWatched ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Status and Condition */}
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {auction.status}
              </Badge>
              <Badge variant={auction.condition === 'new' ? 'default' : 'secondary'}>
                {auction.condition}
              </Badge>
              {auction.category && (
                <Badge variant="outline">
                  {auction.category.name}
                </Badge>
              )}
            </div>

            {/* Current Bid */}
            <div className="mb-6">
              <div className="text-3xl font-bold text-green-600 mb-1">
                ${auction.current_bid.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 flex items-center space-x-4">
                <span>{auction.total_bids} bids</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{Math.floor(Math.random() * 500) + 100} views</span>
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Starting bid: ${auction.starting_price.toFixed(2)}
              </div>
            </div>

            {/* Time Remaining */}
            <div className="flex items-center space-x-2 mb-6 p-3 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">Time remaining</div>
                <div className="text-sm text-orange-700">{timeRemaining}</div>
              </div>
            </div>

            {/* Seller Info */}
            {auction.seller && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Seller Information</h4>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={auction.seller.avatar_url} />
                    <AvatarFallback>
                      {auction.seller.full_name?.charAt(0) || <User className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {auction.seller.full_name || 'Anonymous Seller'}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>4.8 (156 reviews)</span>
                      <Shield className="w-3 h-3 text-green-600" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {auction.description}
              </p>
            </div>

            {/* Shipping Info */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Shipping</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Shipping: ${auction.shipping_cost.toFixed(2)}</span>
              </div>
              {auction.shipping_methods && auction.shipping_methods.length > 0 && (
                <div className="mt-1 text-sm text-gray-600">
                  Methods: {auction.shipping_methods.join(', ')}
                </div>
              )}
            </div>

            <div className="border-t my-6"></div>

            {/* Bid History Section */}
            <div className="mb-6">
              <BidHistory auctionId={auction.id} currentBid={auction.current_bid} />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-auto">
              {isActive && (
                <Button 
                  onClick={handleBidClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Place Bid
                </Button>
              )}
              
              {!isActive && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 font-medium">Auction Ended</div>
                  {auction.winner_id && (
                    <div className="text-sm text-gray-500 mt-1">
                      Winner: {auction.winner?.full_name || 'Anonymous'}
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1" onClick={handleWatchlistClick}>
                  <Heart className={`w-4 h-4 mr-2 ${isWatched ? 'fill-current text-red-500' : ''}`} />
                  {isWatched ? 'Watching' : 'Watch'}
                </Button>
                <Button variant="outline" className="flex-1">
                  View Seller
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}