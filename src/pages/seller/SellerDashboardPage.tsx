import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useSellerAuth } from '@/hooks/useSellerAuth'
import { Store, Package, DollarSign, Users, Plus, TrendingUp, Clock, Eye, Star, ArrowUpRight, AlertTriangle } from 'lucide-react'

export function SellerDashboardPage() {
  const { getSellerUser } = useSellerAuth()
  const sellerAuth = getSellerUser()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeListings: 0,
      totalSales: 0,
      customers: 0,
      revenue: 0
    },
    recentListings: [],
    monthlyPerformance: [],
    notifications: []
  })

  useEffect(() => {
    // Simulate fetching real dashboard data
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock realistic data
        setDashboardData({
          stats: {
            activeListings: Math.floor(Math.random() * 20) + 5,
            totalSales: Math.floor(Math.random() * 5000) + 1000,
            customers: Math.floor(Math.random() * 100) + 20,
            revenue: Math.floor(Math.random() * 30) + 5
          },
          recentListings: [
            {
              id: 1,
              title: 'Vintage Leica Camera M3',
              currentBid: 1250,
              bids: 15,
              views: 245,
              timeLeft: '2h 15m',
              status: 'active',
              image: '/api/placeholder/60/60'
            },
            {
              id: 2,
              title: 'Rolex Submariner Watch',
              currentBid: 8500,
              bids: 8,
              views: 189,
              timeLeft: '1d 4h',
              status: 'active',
              image: '/api/placeholder/60/60'
            },
            {
              id: 3,
              title: 'Rare Comic Book Collection',
              currentBid: 320,
              bids: 23,
              views: 567,
              timeLeft: '6h 30m',
              status: 'active',
              image: '/api/placeholder/60/60'
            },
            {
              id: 4,
              title: 'Antique Persian Rug',
              currentBid: 2100,
              bids: 5,
              views: 134,
              timeLeft: '3d 2h',
              status: 'active',
              image: '/api/placeholder/60/60'
            }
          ],
          monthlyPerformance: [
            { month: 'Jan', sales: 2800, listings: 12 },
            { month: 'Feb', sales: 3200, listings: 15 },
            { month: 'Mar', sales: 4100, listings: 18 },
            { month: 'Apr', sales: 3800, listings: 16 },
            { month: 'May', sales: 4500, listings: 20 },
            { month: 'Jun', sales: 5200, listings: 22 }
          ],
          notifications: [
            { id: 1, type: 'bid', message: 'New bid on Vintage Leica Camera', time: '2 min ago', read: false },
            { id: 2, type: 'warning', message: 'Listing "Antique Persian Rug" expiring soon', time: '1 hour ago', read: false },
            { id: 3, type: 'sale', message: 'Comic Book Collection sold for $320', time: '3 hours ago', read: true }
          ]
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!sellerAuth) {
    return null // Should be handled by SellerProtectedRoute
  }

  const { user, profile } = sellerAuth

  const stats = [
    {
      label: 'Active Listings',
      value: dashboardData.stats.activeListings.toString(),
      icon: Package,
      color: 'text-blue-600',
      change: '+2 this week'
    },
    {
      label: 'Total Sales',
      value: `$${dashboardData.stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      change: '+12% this month'
    },
    {
      label: 'Customers',
      value: dashboardData.stats.customers.toString(),
      icon: Users,
      color: 'text-purple-600',
      change: '+8 new customers'
    },
    {
      label: 'Revenue Growth',
      value: `+${dashboardData.stats.revenue}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      change: 'vs last month'
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
                            <span>${listing.currentBid.toLocaleString()}</span>
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
                <Button variant="outline" className="w-full">
                  View All Listings
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
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
                {dashboardData.notifications.map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
                    notification.type === 'bid' ? 'border-blue-500 bg-blue-50' :
                    notification.type === 'warning' ? 'border-orange-500 bg-orange-50' :
                    'border-green-500 bg-green-50'
                  } ${!notification.read ? 'font-medium' : ''}`}>
                    <div className="flex items-start space-x-2">
                      {notification.type === 'bid' && <Star className="w-4 h-4 text-blue-500 mt-0.5" />}
                      {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />}
                      {notification.type === 'sale' && <DollarSign className="w-4 h-4 text-green-500 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button className="h-16 flex flex-col items-center justify-center space-y-1 text-xs">
                    <Plus className="w-4 h-4" />
                    <span>Create Listing</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1 text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>Analytics</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1 text-xs">
                    <Package className="w-4 h-4" />
                    <span>Orders</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1 text-xs">
                    <Store className="w-4 h-4" />
                    <span>Profile</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Performance Overview</span>
            </CardTitle>
            <CardDescription>
              Monthly sales and listing performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData.monthlyPerformance[dashboardData.monthlyPerformance.length - 1]?.sales || 0}
                  </div>
                  <div className="text-sm text-gray-600">Current Month Sales</div>
                  <div className="text-xs text-green-600">+15% from last month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {dashboardData.monthlyPerformance[dashboardData.monthlyPerformance.length - 1]?.listings || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active Listings</div>
                  <div className="text-xs text-green-600">+3 new this week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">94%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                  <div className="text-xs text-gray-500">Above average</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Monthly Trend</h4>
                <div className="space-y-3">
                  {dashboardData.monthlyPerformance.map((month, index) => {
                    const maxValue = Math.max(...dashboardData.monthlyPerformance.map(m => m.sales))
                    const percentage = (month.sales / maxValue) * 100
                    return (
                      <div key={month.month} className="flex items-center space-x-4">
                        <div className="w-12 text-sm text-gray-600">{month.month}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Progress value={percentage} className="h-2" />
                            <span className="text-sm font-medium">${month.sales.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="w-16 text-sm text-gray-500 text-right">
                          {month.listings} listings
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <Button variant="outline" size="sm">
                    Edit Business Information
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}