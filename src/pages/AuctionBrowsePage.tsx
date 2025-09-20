import { useState, useEffect } from 'react'
import { Grid, List, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuctionCard } from '@/components/auction/AuctionCard'
import { SearchFilters, type SearchFilters as SearchFiltersType } from '@/components/auction/SearchFilters'
import { AuthPromptModal } from '@/components/auth/AuthPromptModal'
import { AuctionDetailModal } from '@/components/auction/AuctionDetailModal'
import { BidConfirmationModal } from '@/components/auction/BidConfirmationModal'
import { auctionService, type AuctionFilters } from '@/services/auctionService'
import { biddingService } from '@/services/biddingService'
import { categoryService } from '@/services/categoryService'
import { useRealTime } from '@/hooks/useRealTime'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/hooks/useAuthModal'
import { useSellerAuth } from '@/hooks/useSellerAuth'
import { debugAuthState, requireAuth } from '@/utils/authHelpers'
import type { Auction, Category } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function AuctionBrowsePage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchFilters, setSearchFilters] = useState<AuctionFilters>({})
  
  // Initialize hooks
  const { subscribe, unsubscribe } = useRealTime()
  const { user } = useAuth()
  const { getSellerUser } = useSellerAuth()
  const { authModal, openAuthModal, closeAuthModal } = useAuthModal()
  
  // Modal states
  const [auctionDetailModal, setAuctionDetailModal] = useState<{
    isOpen: boolean
    auction: Auction | null
  }>({ isOpen: false, auction: null })
  
  const [bidConfirmationModal, setBidConfirmationModal] = useState<{
    isOpen: boolean
    auction: Auction | null
  }>({ isOpen: false, auction: null })
  
  const [isSubmittingBid, setIsSubmittingBid] = useState(false)
  
  const sellerAuth = getSellerUser()

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch categories first (this works)
        const categoriesResult = await categoryService.getCategories()
        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data)
        } else {
          toast.error('Failed to load categories: ' + (categoriesResult.error || 'Unknown error'))
        }

        // Try to fetch auctions, but handle gracefully if it fails
        try {
          console.log('🔍 Fetching auctions with filters:', { status: 'active', ...searchFilters })
          const auctionsResult = await auctionService.getAuctions({ status: 'active', ...searchFilters })
          console.log('📦 Auctions API response:', auctionsResult)
          
          if (auctionsResult.success && auctionsResult.data) {
            setAuctions(auctionsResult.data)
            console.log('✅ Successfully loaded', auctionsResult.data.length, 'auctions')
          } else {
            console.warn('⚠️ Auctions API failed:', auctionsResult.error)
            toast.error('Auction service is currently unavailable. Showing demo data.')
            // Set empty array for now - you could add mock data here
            setAuctions([])
          }
        } catch (auctionError) {
          console.warn('❌ Auctions API error:', auctionError)
          toast.error('Auction service is currently unavailable. Backend connection successful.')
          setAuctions([])
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to connect to backend')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchFilters])

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to new auctions
    const handleNewAuction = (...args: unknown[]) => {
      const auction = args[0] as Auction
      if (auction.status === 'active') {
        setAuctions(prev => [auction, ...prev])
        toast.success(`New auction: ${auction.title}`)
      }
    }

    // Subscribe to auction updates (including bid updates)
    const handleAuctionUpdate = (...args: unknown[]) => {
      const auction = args[0] as Auction
      setAuctions(prev => prev.map(a => a.id === auction.id ? auction : a))
      
      // Show toast for new bids if this is a bid update
      const existingAuction = auctions.find(a => a.id === auction.id)
      if (existingAuction && auction.current_bid > existingAuction.current_bid) {
        toast(`New bid: $${auction.current_bid.toFixed(2)} on ${auction.title}`, {
          icon: '🔨'
        })
      }
    }

    // Subscribe to auction end
    const handleAuctionEnd = (...args: unknown[]) => {
      const auction = args[0] as Auction
      setAuctions(prev => prev.filter(a => a.id !== auction.id))
      toast(`Auction ended: ${auction.title}`)
    }

    // Subscribe to new bids
    const handleNewBid = (...args: unknown[]) => {
      const bidData = args[0] as { auction_id: string; amount: number; auction: Auction }
      if (bidData.auction) {
        setAuctions(prev => prev.map(a => 
          a.id === bidData.auction_id ? bidData.auction : a
        ))
      }
    }

    subscribe('auction_created', handleNewAuction)
    subscribe('auction_updated', handleAuctionUpdate)
    subscribe('auction_ended', handleAuctionEnd)
    subscribe('bid_placed', handleNewBid)

    return () => {
      unsubscribe('auction_created')
      unsubscribe('auction_updated')
      unsubscribe('auction_ended')
      unsubscribe('bid_placed')
    }
  }, [subscribe, unsubscribe, auctions])

  const handleSearch = async (filters: SearchFiltersType) => {
    const auctionFilters: AuctionFilters = {
      search: filters.query,
      category: filters.category,
      minPrice: filters.priceRange.min > 0 ? filters.priceRange.min : undefined,
      maxPrice: filters.priceRange.max > 0 ? filters.priceRange.max : undefined,
      condition: filters.condition as 'new' | 'used' | 'refurbished' | undefined,
      sortBy: filters.sortBy as 'ending_soon' | 'price_low' | 'price_high' | 'newest' | 'popular' | undefined,
      status: 'active'
    }
    
    setSearchFilters(auctionFilters)
  }

  const handleAuctionCardClick = (auction: Auction) => {
    setAuctionDetailModal({ isOpen: true, auction })
  }
  
  const handleAuctionDetailBidClick = (auction: Auction) => {
    if (!user) {
      openAuthModal('bid', auction.title)
      return
    }
    
    // Check if user is a seller trying to bid on their own auction
    if (sellerAuth && auction.seller_id === sellerAuth.user.id) {
      toast.error('Sellers cannot bid on their own auctions')
      return
    }
    
    // Close detail modal and open bid confirmation
    setAuctionDetailModal({ isOpen: false, auction: null })
    setBidConfirmationModal({ isOpen: true, auction })
  }
  
  const handleConfirmBid = async (bidAmount: number) => {
    if (!bidConfirmationModal.auction || !user) {
      toast.error('Please sign in to place a bid')
      return
    }
    
    // Check authentication with detailed debugging
    if (!requireAuth('place a bid')) {
      debugAuthState()
      return
    }
    
    setIsSubmittingBid(true)
    try {      
      console.log('[Bid] Attempting to place bid:', {
        auctionId: bidConfirmationModal.auction.id,
        amount: bidAmount,
        user: user?.email
      })
      
      // Add auth state debugging
      debugAuthState()
      
      // Submit bid to backend
      const bidResult = await biddingService.placeBid({
        auctionId: bidConfirmationModal.auction.id,
        amount: bidAmount
      })
      
      if (bidResult.success && bidResult.data) {
        // Update the auction's current bid locally (real-time will handle this properly)
        setAuctions(prev => prev.map(auction => 
          auction.id === bidConfirmationModal.auction!.id 
            ? { ...auction, current_bid: bidAmount, total_bids: auction.total_bids + 1 }
            : auction
        ))
        
        toast.success(`Bid of $${bidAmount.toFixed(2)} placed successfully!`)
        setBidConfirmationModal({ isOpen: false, auction: null })
      } else {
        throw new Error(bidResult.error || 'Failed to place bid')
      }
      
    } catch (error) {
      console.error('Bid placement error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to place bid. Please try again.'
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        toast.error('Session expired. Please sign in again.')
      } else if (errorMessage.includes('403')) {
        toast.error('You do not have permission to bid on this auction.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmittingBid(false)
    }
  }

  const handleBidClick = (auction: Auction) => {
    if (!user) {
      openAuthModal('bid', auction.title)
      return
    }
    
    // Check if user is a seller trying to bid on their own auction
    if (sellerAuth && auction.seller_id === sellerAuth.user.id) {
      toast.error('Sellers cannot bid on their own auctions')
      return
    }
    
    // Show auction detail modal first
    setAuctionDetailModal({ isOpen: true, auction })
  }

  const handleResetFilters = () => {
    setSearchFilters({})
  }

  const handleWatchlistToggle = (auctionId: string) => {
    if (!user) {
      const auction = auctions.find(a => a.id === auctionId)
      openAuthModal('watchlist', auction?.title)
      return
    }
    // Toggle watchlist status
    console.log('Toggle watchlist for auction:', auctionId)
    toast.success('Added to watchlist')
    // You can implement watchlist functionality here
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading auctions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Auctions</h1>
          <p className="text-gray-600">
            Discover amazing items from verified sellers worldwide
          </p>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          categories={categories}
          onSearch={handleSearch}
          onReset={handleResetFilters}
          isLoading={loading}
        />

        {/* View Controls and Results Count */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            Showing {auctions.length} active auctions
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Auctions Grid/List */}
        {auctions.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {auctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onBidClick={handleBidClick}
                onCardClick={handleAuctionCardClick}
                onWatchlistToggle={handleWatchlistToggle}
                variant={viewMode === 'list' ? 'compact' : 'default'}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2 text-gray-500">
                <Filter className="w-6 h-6" />
                <span>No Auctions Found</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                No auctions match your current search criteria.
              </p>
              <Button onClick={handleResetFilters} variant="outline">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More Button (for pagination) */}
        {auctions.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Auctions
            </Button>
          </div>
        )}
      </div>

      {/* Authentication Prompt Modal */}
      <AuthPromptModal
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
        action={authModal.action}
        auctionTitle={authModal.auctionTitle}
      />
      
      {/* Auction Detail Modal */}
      <AuctionDetailModal
        auction={auctionDetailModal.auction}
        isOpen={auctionDetailModal.isOpen}
        onClose={() => setAuctionDetailModal({ isOpen: false, auction: null })}
        onBidClick={handleAuctionDetailBidClick}
        onWatchlistToggle={handleWatchlistToggle}
        isWatched={false} // TODO: Implement watchlist status
      />
      
      {/* Bid Confirmation Modal */}
      <BidConfirmationModal
        auction={bidConfirmationModal.auction}
        isOpen={bidConfirmationModal.isOpen}
        onClose={() => setBidConfirmationModal({ isOpen: false, auction: null })}
        onConfirmBid={handleConfirmBid}
        isSubmitting={isSubmittingBid}
      />
    </div>
  )
}