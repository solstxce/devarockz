import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Gavel, Heart, TrendingUp, Clock, Plus, Eye } from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    { label: 'Active Bids', value: '5', icon: Gavel, color: 'text-blue-600' },
    { label: 'Watching', value: '12', icon: Eye, color: 'text-purple-600' },
    { label: 'Won Auctions', value: '3', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Items Sold', value: '8', icon: Clock, color: 'text-orange-600' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name}!
          </h1>
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">Manage your auctions and bids</p>
            <Badge variant="outline" className="capitalize">
              {user?.role}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
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
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Vintage Rolex Submariner</h4>
                    <p className="text-sm text-gray-600">Your bid: $7,500</p>
                  </div>
                  <Badge variant="default">Leading</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">MacBook Pro M3</h4>
                    <p className="text-sm text-gray-600">Your bid: $2,200</p>
                  </div>
                  <Badge variant="secondary">Outbid</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  View All Bids
                </Button>
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
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Original Banksy Print</h4>
                    <p className="text-sm text-gray-600">Current bid: $3,200</p>
                  </div>
                  <Badge variant="outline">2d left</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Designer Handbag</h4>
                    <p className="text-sm text-gray-600">Current bid: $450</p>
                  </div>
                  <Badge variant="outline">5h left</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  View All Watched Items
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {(user?.role === 'seller' || user?.role === 'admin') && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Plus className="w-6 h-6" />
                  <span>Create Auction</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <TrendingUp className="w-6 h-6" />
                  <span>View Analytics</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Clock className="w-6 h-6" />
                  <span>Manage Listings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}