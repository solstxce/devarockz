import { Link } from 'react-router-dom'
import { ArrowRight, Gavel, TrendingUp, Shield, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function HomePage() {
  const features = [
    {
      icon: Gavel,
      title: 'Live Auctions',
      description: 'Participate in real-time bidding with instant updates and notifications.'
    },
    {
      icon: Shield,
      title: 'Secure Transactions',
      description: 'Protected payments and verified sellers ensure safe trading experience.'
    },
    {
      icon: TrendingUp,
      title: 'Smart Auto-bidding',
      description: 'Set maximum bids and let our system bid on your behalf automatically.'
    },
    {
      icon: Clock,
      title: '24/7 Access',
      description: 'Browse and bid on auctions anytime, anywhere with our mobile-friendly platform.'
    }
  ]

  const categories = [
    { name: 'Electronics', count: 1250, image: '📱' },
    { name: 'Fashion', count: 890, image: '👗' },
    { name: 'Art & Collectibles', count: 456, image: '🎨' },
    { name: 'Jewelry', count: 234, image: '💎' },
    { name: 'Home & Garden', count: 678, image: '🏠' },
    { name: 'Sports', count: 345, image: '⚽' }
  ]

  const stats = [
    { label: 'Active Auctions', value: '12,345' },
    { label: 'Registered Users', value: '50,000+' },
    { label: 'Items Sold', value: '100k+' },
    { label: 'Success Rate', value: '98%' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm">
              🎉 New: Auto-bidding feature now available!
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover Unique Items at{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Live Auctions
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of buyers and sellers in the most exciting online auction platform. 
              Bid on rare items, collectibles, and everyday treasures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
              >
                <Link to="/auctions">
                  Start Bidding
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                <Link to="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-xl text-gray-600">
              Explore thousands of auctions across diverse categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/auctions?category=${category.name.toLowerCase()}`}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">{category.image}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.count} items</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AuctionHub?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the future of online auctions with our advanced features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="text-center">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Auction Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our community of passionate bidders and sellers. Create your account today 
            and discover amazing deals on unique items.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              <Link to="/signup">
                <Users className="mr-2 w-5 h-5" />
                Join AuctionHub
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3"
            >
              <Link to="/auctions">Browse Auctions</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}