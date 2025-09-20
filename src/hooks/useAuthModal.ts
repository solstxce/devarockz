import { useState } from 'react'

interface AuthModalState {
  isOpen: boolean
  action: 'bid' | 'watchlist' | 'general'
  auctionTitle?: string
}

export function useAuthModal() {
  const [authModal, setAuthModal] = useState<AuthModalState>({
    isOpen: false,
    action: 'general'
  })

  const openAuthModal = (action: 'bid' | 'watchlist' | 'general', auctionTitle?: string) => {
    setAuthModal({
      isOpen: true,
      action,
      auctionTitle
    })
  }

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }))
  }

  return {
    authModal,
    openAuthModal,
    closeAuthModal
  }
}