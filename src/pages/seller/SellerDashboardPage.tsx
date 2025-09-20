import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSellerAuth } from '@/hooks/useSellerAuth'
import { useSellerRealTime } from '@/hooks/useSellerRealTime'
import { sellerDashboardService, type SellerStats } from '@/services/sellerDashboardService'
import { Store, Package, DollarSign, Plus, TrendingUp, Clock, Eye, Star, ArrowUpRight, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface DashboardListing {
  id: string
  title: string
  currentBid?: number
  price?: number
  bids?: number
  views?: number
  timeLeft?: string
  status: string
  image?: string
  type: 'product' | 'auction'
  created_at: string
  end_time?: string
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
  time?: string
}

interface DashboardData {
  stats: SellerStats
  recentListings: DashboardListing[]
  notifications: SellerNotification[]
}

export function SellerDashboardPage() {
  const { getSellerUser } = useSellerAuth()
  const sellerAuth = getSellerUser()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<SellerNotification[]>([])
  const initialLoadComplete = useRef(false)
  
  const [dashboardData, setDashboardData] = useState<Omit<DashboardData, 'notifications'>>({
    stats: {
      total_products: 0,
      active_products: 0,
      total_auctions: 0,
      active_auctions: 0,
      total_orders: 0,
      total_revenue: 0,
      pending_orders: 0
    },
    recentListings: []
  })

  // Handle real-time updates
  const handleStatsUpdated = useCallback((stats: SellerStats | null) => {
    if (stats) {
      setDashboardData(prev => ({ ...prev, stats }))
      toast.success('Dashboard updated!')
    }
    // Don't refetch on null - let the bid handler trigger refresh if needed
  }, [])

  const handleNewBid = useCallback((notification: SellerNotification) => {
    // Add notification to the list
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep latest 10
    
    toast.success(`New bid received: ${notification.message}`)
    
    // Trigger a fresh stats fetch only if initial load is complete
    if (sellerAuth && initialLoadComplete.current) {
      sellerDashboardService.getSellerStats().then(result => {
        if (result.success && result.data) {
          setDashboardData(prev => ({ ...prev, stats: result.data! }))
        }
      }).catch(console.error)
    }
  }, [sellerAuth])

  const handleNotification = useCallback((notification: SellerNotification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)])
  }, [])

  // Initialize real-time updates
  useSellerRealTime({
    onStatsUpdated: handleStatsUpdated,
    onNewBid: handleNewBid,
    onNotification: handleNotification
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerAuth || initialLoadComplete.current) return

      setLoading(true)
      try {
        console.log('[SellerDashboard] Fetching dashboard data...')
        
        const [statsResult, listingsResult] = await Promise.allSettled([
          sellerDashboardService.getSellerStats(),
          sellerDashboardService.getSellerListings({ limit: 10 })
        ])

        const defaultStats = {
          total_products: 0,
          active_products: 0,
          total_auctions: 0,
          active_auctions: 0,
          total_orders: 0,
          total_revenue: 0,
          pending_orders: 0
        }
        
        let stats = defaultStats
        let listings: DashboardListing[] = []

        if (statsResult.status === 'fulfilled' && statsResult.value.success) {
          stats = statsResult.value.data || defaultStats
        } else {
          console.warn('[SellerDashboard] Failed to fetch stats:', statsResult)
        }

        if (listingsResult.status === 'fulfilled' && listingsResult.value.success) {
          const rawListings = Array.isArray(listingsResult.value.data) 
            ? listingsResult.value.data 
            : []
          
          listings = rawListings.map((listing: Record<string, unknown>) => ({
            id: listing.id as string,
            title: listing.title as string,
            currentBid: listing.current_bid as number,
            price: listing.price as number,
            bids: (listing.total_bids as number) || 0,
            views: Math.floor(Math.random() * 500) + 50, // Mock views for now
            timeLeft: listing.end_time ? formatDistanceToNow(new Date(listing.end_time as string), { addSuffix: true }) : undefined,
            status: listing.status as string,
            image: (listing.images as string[])?.[0],
            type: listing.type === 'auction' ? 'auction' as const : 'product' as const,
            created_at: listing.created_at as string,
            end_time: listing.end_time as string
          }))
        } else {
          console.warn('[SellerDashboard] Failed to fetch listings:', listingsResult)
        }

        setDashboardData({
          stats,
          recentListings: listings
        })

        initialLoadComplete.current = true

      } catch (error) {
        console.error('[SellerDashboard] Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sellerAuth])

  if (!sellerAuth) {
    return null // Should be handled by SellerProtectedRoute
  }

  const { user, profile } = sellerAuth

  const stats = [
    {
      label: 'Active Products',
      value: dashboardData.stats.active_products.toString(),
      icon: Package,
      color: 'text-blue-600',
      change: `+${dashboardData.stats.total_products - dashboardData.stats.active_products} inactive`
    },
    {
      label: 'Total Revenue',
      value: `$${dashboardData.stats.total_revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      change: `${dashboardData.stats.total_orders} orders`
    },
    {
      label: 'Active Auctions',
      value: dashboardData.stats.active_auctions.toString(),
      icon: TrendingUp,
      color: 'text-purple-600',
      change: `${dashboardData.stats.total_auctions} total`
    },
    {
      label: 'Pending Orders',
      value: dashboardData.stats.pending_orders.toString(),
      icon: Clock,
      color: 'text-orange-600',
      change: 'Needs attention'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile.business_name}!
              </h1>
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">Manage your products and auctions</p>
                <Badge variant="outline" className="capitalize">
                  {profile.verification_status}
                </Badge>
                <Badge variant={profile.verification_status === 'verified' ? 'default' : 'secondary'}>
                  {profile.verification_status === 'verified' ? 'Verified Seller' : 'Pending Verification'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>Recent Listings</span>
                </div>
                <Badge variant="outline">{dashboardData.recentListings.length} active</Badge>
              </CardTitle>
              <CardDescription>
                Your latest product listings with real-time activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentListings.map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{listing.title}</h4>
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>${(listing.currentBid || listing.price || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{listing.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{listing.timeLeft}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="text-xs">
                        {listing.bids} bids
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link to="/seller/listings">
                  <Button variant="outline" className="w-full">
                    View All Listings
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Notifications & Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Recent activity and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                {notifications.length > 0 ? notifications.map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
                    notification.type === 'new_bid' ? 'border-blue-500 bg-blue-50' :
                    notification.type === 'warning' ? 'border-orange-500 bg-orange-50' :
                    'border-green-500 bg-green-50'
                  } ${!notification.is_read ? 'font-medium' : ''}`}>
                    <div className="flex items-start space-x-2">
                      {notification.type === 'new_bid' && <Star className="w-4 h-4 text-blue-500 mt-0.5" />}
                      {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />}
                      {notification.type === 'sale' && <DollarSign className="w-4 h-4 text-green-500 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time || formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</p>
                      </div>
                      {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/sell">
                    <Button className="h-16 w-full flex flex-col items-center justify-center space-y-1 text-xs">
                      <Plus className="w-4 h-4" />
                      <span>Create Listing</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center justify-center space-y-1 text-xs"
                    onClick={() => toast('Analytics feature coming soon!')}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Analytics</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center justify-center space-y-1 text-xs"
                    onClick={() => toast('Orders management coming soon!')}
                  >
                    <Package className="w-4 h-4" />
                    <span>Orders</span>
                  </Button>
                  <Link to="/seller/profile">
                    <Button variant="outline" className="h-16 w-full flex flex-col items-center justify-center space-y-1 text-xs">
                      <Store className="w-4 h-4" />
                      <span>Profile</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Business Information</span>
            </CardTitle>
            <CardDescription>
              Your seller account details and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Business Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business Name:</span>
                    <span className="font-medium">{profile.business_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{profile.business_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{profile.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Business Address</h4>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{profile.business_address.street}</p>
                  <p className="font-medium">{profile.business_address.city}, {profile.business_address.state} {profile.business_address.zip_code}</p>
                  <p className="font-medium">{profile.business_address.country}</p>
                </div>
                <div className="mt-4">
                  <Link to="/seller/profile">
                    <Button variant="outline" size="sm">
                      Edit Business Information
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}