import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserPlus, LogIn, Gavel, Heart, Shield, Star, TrendingUp } from 'lucide-react'

interface AuthPromptModalProps {
  isOpen: boolean
  onClose: () => void
  action: 'bid' | 'watchlist' | 'general'
  auctionTitle?: string
}

export function AuthPromptModal({ isOpen, onClose, action, auctionTitle }: AuthPromptModalProps) {
  const [selectedTab, setSelectedTab] = useState<'buyer' | 'seller'>('buyer')

  const actionMessages = {
    bid: {
      title: 'Sign in to Place Bid',
      description: `Join thousands of bidders and start bidding on "${auctionTitle || 'this item'}"`,
      icon: Gavel,
      color: 'text-blue-600'
    },
    watchlist: {
      title: 'Sign in to Save Item',
      description: `Save "${auctionTitle || 'this item'}" to your watchlist and get notified of updates`,
      icon: Heart,
      color: 'text-red-600'
    },
    general: {
      title: 'Join AuctionHub Today',
      description: 'Create an account to start bidding, selling, and discovering amazing items',
      icon: UserPlus,
      color: 'text-purple-600'
    }
  }

  const currentAction = actionMessages[action]
  const ActionIcon = currentAction.icon

  const benefits = [
    { icon: Gavel, text: 'Bid on exclusive auctions', color: 'text-blue-600' },
    { icon: Heart, text: 'Save items to your watchlist', color: 'text-red-600' },
    { icon: Shield, text: 'Secure payment protection', color: 'text-green-600' },
    { icon: Star, text: 'Build your reputation', color: 'text-yellow-600' },
    { icon: TrendingUp, text: 'Track your bidding history', color: 'text-purple-600' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-6 text-white">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <ActionIcon className={`w-8 h-8 text-white`} />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              {currentAction.title}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm">
              {currentAction.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          {/* Account Type Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('buyer')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'buyer'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              I want to buy
            </button>
            <button
              onClick={() => setSelectedTab('seller')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'seller'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              I want to sell
            </button>
          </div>

          {/* Benefits List */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Why join AuctionHub?</h4>
            <div className="space-y-2">
              {benefits.slice(0, selectedTab === 'buyer' ? 3 : 5).map((benefit, index) => {
                const BenefitIcon = benefit.icon
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
                      <BenefitIcon className={`w-4 h-4 ${benefit.color}`} />
                    </div>
                    <span className="text-sm text-gray-700">{benefit.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {selectedTab === 'buyer' ? (
              <>
                <Link to="/signup" onClick={onClose}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Buyer Account
                  </Button>
                </Link>
                <Link to="/login" onClick={onClose}>
                  <Button variant="outline" className="w-full hover:bg-gray-50 transition-all duration-200">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/seller/signup" onClick={onClose}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Seller Account
                  </Button>
                </Link>
                <Link to="/seller/login" onClick={onClose}>
                  <Button variant="outline" className="w-full hover:bg-gray-50 transition-all duration-200">
                    <LogIn className="w-4 h-4 mr-2" />
                    Seller Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <button className="text-blue-600 hover:underline">Terms of Service</button>
              {' '}and{' '}
              <button className="text-blue-600 hover:underline">Privacy Policy</button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}