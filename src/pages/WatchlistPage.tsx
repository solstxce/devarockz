import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useSellerAuth } from '@/hooks/useSellerAuth'
import {
  Heart,
  Search,
  Clock,
  DollarSign,
  Eye,
  TrendingUp,
  Filter,
  Grid,
  List
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface WatchlistItem {
  id: string
  title: string
  description: string
  currentBid: number
  bidCount: number
  timeLeft: string
  imageUrl: string
  category: string
  seller: string
  isEndingSoon: boolean
  hasNewBid: boolean
}

export function WatchlistPage() {
  const { user } = useAuth()
  const { getSellerUser } = useSellerAuth()
  const sellerAuth = getSellerUser()

  const isAuthenticated = !!(user || sellerAuth)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'timeLeft' | 'currentBid' | 'newest'>('timeLeft')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Mock watchlist data
  const watchlistItems: WatchlistItem[] = [
    {
      id: '1',
      title: 'Vintage Rolex Submariner',
      description: '1970s vintage Rolex Submariner in excellent condition',
      currentBid: 7500,
      bidCount: 12,
      timeLeft: '2h 15m',
      imageUrl: '/api/placeholder/300/200',
      category: 'Jewelry & Watches',
      seller: 'Vintage Watches Co',
      isEndingSoon: true,
      hasNewBid: true
    },
    {
      id: '2',
      title: 'MacBook Pro M3 14"',
      description: 'Brand new MacBook Pro with M3 chip, 16GB RAM, 512GB SSD',
      currentBid: 2200,
      bidCount: 8,
      timeLeft: '1d 4h',
      imageUrl: '/api/placeholder/300/200',
      category: 'Electronics',
      seller: 'TechDeals Inc',
      isEndingSoon: false,
      hasNewBid: false
    },
    {
      id: '3',
      title: 'Original Banksy Art Print',
      description: 'Limited edition signed Banksy print with certificate',
      currentBid: 3200,
      bidCount: 15,
      timeLeft: '3d 12h',
      imageUrl: '/api/placeholder/300/200',
      category: 'Art',
      seller: 'Art Gallery NYC',
      isEndingSoon: false,
      hasNewBid: false
    },
    {
      id: '4',
      title: 'Designer Handbag Collection',
      description: 'Collection of 3 vintage designer handbags including Chanel and Louis Vuitton',
      currentBid: 1800,
      bidCount: 6,
      timeLeft: '5h 30m',
      imageUrl: '/api/placeholder/300/200',
      category: 'Fashion & Accessories',
      seller: 'Luxury Fashion',
      isEndingSoon: true,
      hasNewBid: true
    }
  ]

  const categories = ['all', ...new Set(watchlistItems.map(item => item.category))]

  const filteredItems = watchlistItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'currentBid':
        return b.currentBid - a.currentBid
      case 'timeLeft':
        return a.timeLeft.localeCompare(b.timeLeft)
      case 'newest':
        return b.id.localeCompare(a.id)
      default:
        return 0
    }
  })

  const removeFromWatchlist = (itemId: string) => {
    console.log('Remove from watchlist:', itemId)
    // Implement remove from watchlist logic
  }

  const placeBid = (itemId: string) => {
    console.log('Place bid on item:', itemId)
    // Implement bid placement logic
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your watchlist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Watchlist</h1>
              <p className="text-gray-600">
                {watchlistItems.length} items saved • {watchlistItems.filter(item => item.isEndingSoon).length} ending soon
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
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
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search watchlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="lg:w-48">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.filter(cat => cat !== 'all').map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="lg:w-48">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timeLeft">Time Left</SelectItem>
                    <SelectItem value="currentBid">Current Bid</SelectItem>
                    <SelectItem value="newest">Newest Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Watchlist Items */}
        {sortedItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h3>
              <p className="text-gray-600 mb-6">Save items you're interested in by clicking the heart icon on any auction</p>
              <Link to="/auctions">
                <Button>Browse Auctions</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-6"
          }>
            {sortedItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div className="aspect-video bg-gray-200 relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/90 hover:bg-white"
                          onClick={() => removeFromWatchlist(item.id)}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                      {item.isEndingSoon && (
                        <Badge className="absolute top-2 left-2 bg-red-500">
                          Ending Soon
                        </Badge>
                      )}
                      {item.hasNewBid && (
                        <Badge className="absolute bottom-2 left-2 bg-blue-500">
                          New Bid
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-gray-900">${item.currentBid.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{item.bidCount} bids</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-orange-600">{item.timeLeft}</p>
                            <p className="text-xs text-gray-500">left</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => placeBid(item.id)}
                          >
                            Place Bid
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  // List View
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromWatchlist(item.id)}
                          >
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </Button>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div>
                            <p className="text-lg font-bold text-gray-900">${item.currentBid.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{item.bidCount} bids</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-orange-600">{item.timeLeft}</p>
                            <p className="text-xs text-gray-500">time left</p>
                          </div>
                          <div>
                            <Badge variant="outline">{item.category}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">Seller: {item.seller}</p>
                          <Button
                            onClick={() => placeBid(item.id)}
                          >
                            Place Bid
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}