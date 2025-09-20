import type { User } from '@supabase/supabase-js'

type AuthAction = 'bid' | 'watchlist' | 'general'

interface AuthRequiredActionOptions {
  user: User | null
  action: AuthAction
  auctionTitle?: string
  onAuthRequired: (action: AuthAction, auctionTitle?: string) => void
  onAuthenticated: () => void
}

/**
 * Utility function to check if user is authenticated before performing an action
 * If not authenticated, shows the auth modal; if authenticated, executes the action
 */
export function withAuthRequired({
  user,
  action,
  auctionTitle,
  onAuthRequired,
  onAuthenticated
}: AuthRequiredActionOptions) {
  if (!user) {
    onAuthRequired(action, auctionTitle)
    return
  }
  
  onAuthenticated()
}

/**
 * Higher-order function that wraps an auction action with authentication check
 */
export function createAuthenticatedAction(
  user: User | null,
  openAuthModal: (action: AuthAction, auctionTitle?: string) => void
) {
  return (action: AuthAction, callback: () => void, auctionTitle?: string) => {
    withAuthRequired({
      user,
      action,
      auctionTitle,
      onAuthRequired: openAuthModal,
      onAuthenticated: callback
    })
  }
}

export type { AuthAction }