import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { userDashboardService, type DashboardData } from '@/services/userDashboardService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gavel, Heart, TrendingUp, Plus, Eye, DollarSign, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export function DashboardPage() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setError('Please sign in to view your dashboard')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = await userDashboardService.getDashboardData()
      
      if (result.success && result.data) {
        setDashboardData(result.data)
      } else {
        setError(result.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleRefresh = () => {
    fetchDashboardData()
    toast.success('Dashboard refreshed')
  }

  const getBidStatusBadge = (status: string) => {
    switch (status) {
      case 'leading':
        return <Badge variant="default" className="bg-green-600">Leading</Badge>
      case 'outbid':
        return <Badge variant="secondary">Outbid</Badge>
      case 'won':
        return <Badge variant="default" className="bg-blue-600">Won</Badge>
      case 'lost':
        return <Badge variant="outline">Lost</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your dashboard</CardDescription>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = dashboardData ? [
    { label: 'Active Bids', value: dashboardData.stats.active_bids.toString(), icon: Gavel, color: 'text-blue-600' },
    { label: 'Watching', value: dashboardData.stats.watching_count.toString(), icon: Eye, color: 'text-purple-600' },
    { label: 'Won Auctions', value: dashboardData.stats.won_auctions.toString(), icon: TrendingUp, color: 'text-green-600' },
    { label: 'Items Sold', value: dashboardData.stats.items_sold.toString(), icon: ShoppingBag, color: 'text-orange-600' }
  ] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.full_name || user?.email}!
              </h1>
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">Manage your auctions and bids</p>
                <Badge variant="outline" className="capitalize">
                  {user?.role || 'buyer'}
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                className="ml-4"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {dashboardData && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Financial Summary */}
            {(dashboardData.stats.total_spent > 0 || dashboardData.stats.total_earned > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Spent</p>
                        <p className="text-2xl font-bold text-red-600">${dashboardData.stats.total_spent.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-full bg-red-100 text-red-600">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Earned</p>
                        <p className="text-2xl font-bold text-green-600">${dashboardData.stats.total_earned.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Active Bids */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gavel className="w-5 h-5 text-blue-600" />
                    <span>Your Active Bids</span>
                  </CardTitle>
                  <CardDescription>
                    Auctions you're currently bidding on
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activeBids.length > 0 ? (
                      <>
                        {dashboardData.activeBids.slice(0, 3).map((bid) => (
                          <div key={bid.auction_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{bid.auction_title}</h4>
                              <p className="text-sm text-gray-600">
                                Your bid: ${bid.bid_amount.toFixed(2)} | Current: ${bid.current_bid.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Ends {formatDistanceToNow(new Date(bid.end_time), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="ml-4">
                              {getBidStatusBadge(bid.status)}
                            </div>
                          </div>
                        ))}
                        <Link to="/bids">
                          <Button variant="outline" className="w-full">
                            View All Bids ({dashboardData.activeBids.length})
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Gavel className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No active bids</p>
                        <Link to="/auctions">
                          <Button>Browse Auctions</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Watchlist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-purple-600" />
                    <span>Your Watchlist</span>
                  </CardTitle>
                  <CardDescription>
                    Items you're interested in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.watchlist.length > 0 ? (
                      <>
                        {dashboardData.watchlist.slice(0, 3).map((item) => (
                          <div key={item.auction_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.auction_title}</h4>
                              <p className="text-sm text-gray-600">
                                Current bid: ${item.current_bid.toFixed(2)} | {item.bid_count} bids
                              </p>
                              <p className="text-xs text-gray-500">
                                Ends {formatDistanceToNow(new Date(item.end_time), { addSuffix: true })}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-4">
                              {item.status}
                            </Badge>
                          </div>
                        ))}
                        <Link to="/watchlist">
                          <Button variant="outline" className="w-full">
                            View All Watched Items ({dashboardData.watchlist.length})
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No items in watchlist</p>
                        <Link to="/auctions">
                          <Button>Browse Auctions</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link to="/auctions">
                    <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center space-y-2 hover:bg-blue-50">
                      <Eye className="w-6 h-6 text-blue-600" />
                      <span>Browse Auctions</span>
                    </Button>
                  </Link>
                  <Link to="/sell">
                    <Button className="h-24 w-full flex flex-col items-center justify-center space-y-2">
                      <Plus className="w-6 h-6" />
                      <span>Sell Item</span>
                    </Button>
                  </Link>
                  <Link to="/watchlist">
                    <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center space-y-2 hover:bg-purple-50">
                      <Heart className="w-6 h-6 text-purple-600" />
                      <span>My Watchlist</span>
                    </Button>
                  </Link>
                  <Link to="/bids">
                    <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center space-y-2 hover:bg-green-50">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      <span>My Bids</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}