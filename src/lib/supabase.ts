import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  role: 'bidder' | 'seller' | 'admin'
  full_name: string
  avatar_url?: string
  phone?: string
  address?: Record<string, unknown>
  created_at: string
  updated_at: string
  is_verified: boolean
  is_active: boolean
}

export interface Category {
  id: string
  name: string
  description: string
  parent_id?: string
  is_active: boolean
  created_at: string
}

export interface Auction {
  id: string
  seller_id: string
  category_id: string
  title: string
  description: string
  starting_price: number
  reserve_price?: number
  current_bid: number
  bid_increment: number
  start_time: string
  end_time: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  winner_id?: string
  total_bids: number
  images: string[]
  condition: 'new' | 'used' | 'refurbished'
  shipping_cost: number
  shipping_methods: string[]
  created_at: string
  updated_at: string
  seller?: User
  category?: Category
  winner?: User
}

export interface Bid {
  id: string
  auction_id: string
  bidder_id: string
  amount: number
  is_auto_bid: boolean
  max_auto_bid?: number
  created_at: string
  ip_address: string
  bidder?: User
}

export interface Transaction {
  id: string
  auction_id: string
  buyer_id: string
  seller_id: string
  final_amount: number
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method: string
  stripe_payment_intent_id?: string
  shipping_status: 'pending' | 'shipped' | 'delivered'
  tracking_number?: string
  created_at: string
  updated_at: string
  auction?: Auction
  buyer?: User
  seller?: User
}

export interface Notification {
  id: string
  user_id: string
  type: 'bid_placed' | 'outbid' | 'auction_won' | 'auction_ended' | 'payment_required'
  title: string
  message: string
  auction_id?: string
  is_read: boolean
  created_at: string
  auction?: Auction
}