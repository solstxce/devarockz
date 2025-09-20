import { useState } from 'react'
import { Heart, Clock, Gavel, User, MapPin } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Auction } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface AuctionCardProps {
  auction: Auction
  onBidClick?: (auction: Auction) => void
  onWatchlistToggle?: (auctionId: string) => void
  onCardClick?: (auction: Auction) => void
  isWatched?: boolean
  variant?: 'default' | 'compact'
}

export function AuctionCard({ 
  auction, 
  onBidClick, 
  onWatchlistToggle,
  onCardClick, 
  isWatched = false,
  variant = 'default'
}: AuctionCardProps) {
  const [imageError, setImageError] = useState(false)
  
  const timeRemaining = formatDistanceToNow(new Date(auction.end_time), { addSuffix: true })
  const isActive = auction.status === 'active' && new Date(auction.end_time) > new Date()
  
  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onWatchlistToggle?.(auction.id)
  }

  const handleBidClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onBidClick?.(auction)
  }

  const handleCardClick = () => {
    onCardClick?.(auction)
  }

  if (variant === 'compact') {
    return (
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm" onClick={handleCardClick}>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {auction.images && auction.images.length > 0 && !imageError ? (
                <img
                  src={auction.images[0]}
                  alt={auction.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Gavel className="w-8 h-8" />
                </div>
              )}
              <Badge 
                variant={auction.condition === 'new' ? 'default' : 'secondary'} 
                className="absolute top-1 right-1 text-xs"
              >
                {auction.condition}
              </Badge>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-sm leading-tight text-gray-900 truncate">
                  {auction.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWatchlistClick}
                  className="p-1 h-auto text-gray-400 hover:text-red-500"
                >
                  <Heart className={`w-4 h-4 ${isWatched ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{timeRemaining}</span>
              </div>
              
              <div className="mt-2">
                <div className="text-lg font-bold text-green-600">
                  ${auction.current_bid.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {auction.total_bids} bids
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm overflow-hidden" onClick={handleCardClick}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {auction.images && auction.images.length > 0 && !imageError ? (
          <img
            src={auction.images[0]}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Gavel className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Status and Condition Badges */}
        <div className="absolute top-3 left-3 space-y-2">
          <Badge 
            variant={isActive ? 'default' : 'secondary'} 
            className="bg-white/90 text-gray-900 shadow-sm"
          >
            {auction.status}
          </Badge>
          <Badge 
            variant={auction.condition === 'new' ? 'default' : 'secondary'} 
            className="bg-white/90 text-gray-900 shadow-sm"
          >
            {auction.condition}
          </Badge>
        </div>
        
        {/* Watchlist Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleWatchlistClick}
          className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white shadow-sm"
        >
          <Heart className={`w-4 h-4 ${isWatched ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </Button>
        
        {/* Time Remaining Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{timeRemaining}</span>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg leading-tight text-gray-900 mb-2 line-clamp-2">
          {auction.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {auction.description}
        </p>
        
        {/* Seller Info */}
        {auction.seller && (
          <div className="flex items-center space-x-2 mb-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={auction.seller.avatar_url} />
              <AvatarFallback className="text-xs">
                {auction.seller.full_name?.charAt(0) || <User className="w-3 h-3" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600 truncate">
              {auction.seller.full_name}
            </span>
          </div>
        )}
        
        {/* Category and Shipping */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center space-x-1">
            <span>{auction.category?.name}</span>
          </span>
          <span className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>Shipping: ${auction.shipping_cost.toFixed(2)}</span>
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-green-600">
            ${auction.current_bid.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            {auction.total_bids} bids • Starting at ${auction.starting_price.toFixed(2)}
          </div>
        </div>
        
        {isActive && (
          <Button 
            onClick={handleBidClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Gavel className="w-4 h-4 mr-2" />
            Bid Now
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}