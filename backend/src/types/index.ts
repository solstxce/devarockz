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

// Product types
export interface Product {
  id: string
  seller_id: string
  category_id: string
  title: string
  description: string
  price?: number
  compare_at_price?: number
  cost_price?: number
  sku?: string
  barcode?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  type: 'auction' | 'fixed_price' | 'both'
  stock_quantity: number
  track_quantity: boolean
  allow_backorder: boolean
  requires_shipping: boolean
  is_taxable: boolean
  tax_rate: number
  images: string[]
  condition: 'new' | 'used' | 'refurbished'
  brand?: string
  model?: string
  tags: string[]
  features?: Record<string, unknown>
  specifications?: Record<string, unknown>
  shipping_cost: number
  shipping_methods: string[]
  meta_title?: string
  meta_description?: string
  slug?: string
  is_active: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
  
  // Auction-specific fields
  auction_id?: string
  starting_price?: number
  reserve_price?: number
  bid_increment?: number
  auction_start_time?: string
  auction_end_time?: string
  
  // Relations
  seller?: User
  category?: Category
  variants?: ProductVariant[]
  reviews?: ProductReview[]
  average_rating?: number
  review_count?: number
}

export interface ProductVariant {
  id: string
  product_id: string
  title: string
  price?: number
  compare_at_price?: number
  sku?: string
  barcode?: string
  weight?: number
  stock_quantity: number
  option1?: string
  option2?: string
  option3?: string
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
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
  auction?: Auction
}

// Shopping Cart types
export interface ShoppingCart {
  id: string
  user_id: string
  status: 'active' | 'saved' | 'expired'
  created_at: string
  updated_at: string
  expires_at: string
  items?: CartItem[]
  total_items?: number
  subtotal?: number
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  variant_id?: string
  quantity: number
  price: number
  created_at: string
  updated_at: string
  product?: Product
  variant?: ProductVariant
  total?: number
}

// Order types
export interface Order {
  id: string
  user_id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: number
  tax_amount: number
  shipping_cost: number
  discount_amount: number
  total_amount: number
  customer_email?: string
  customer_phone?: string
  billing_address?: Address
  shipping_address?: Address
  shipping_method?: string
  tracking_number?: string
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  payment_gateway?: string
  payment_transaction_id?: string
  fulfillment_status: 'pending' | 'shipped' | 'delivered'
  shipped_at?: string
  delivered_at?: string
  notes?: string
  tags: string[]
  created_at: string
  updated_at: string
  items?: OrderItem[]
  user?: User
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id?: string
  title: string
  sku?: string
  quantity: number
  price: number
  total: number
  created_at: string
  product?: Product
  variant?: ProductVariant
}

export interface Address {
  first_name: string
  last_name: string
  company?: string
  address1: string
  address2?: string
  city: string
  province: string
  country: string
  zip: string
  phone?: string
}

// Inventory types
export interface InventoryMovement {
  id: string
  product_id?: string
  variant_id?: string
  movement_type: 'sale' | 'restock' | 'adjustment' | 'return'
  quantity_change: number
  quantity_after: number
  reference_id?: string
  reference_type?: string
  notes?: string
  created_at: string
  created_by?: string
  product?: Product
  variant?: ProductVariant
}

// Review types
export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  order_id?: string
  rating: number
  title?: string
  content?: string
  verified_purchase: boolean
  is_approved: boolean
  helpful_count: number
  created_at: string
  updated_at: string
  user?: User
  product?: Product
}

// Wishlist types
export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  variant_id?: string
  created_at: string
  product?: Product
  variant?: ProductVariant
}

// Discount types
export interface Discount {
  id: string
  code: string
  title: string
  description?: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number
  minimum_order_amount?: number
  usage_limit?: number
  usage_count: number
  customer_usage_limit: number
  starts_at?: string
  ends_at?: string
  is_active: boolean
  created_at: string
}

export interface Watchlist {
  id: string
  user_id: string
  auction_id: string
  created_at: string
  auction?: Auction
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
  type: 'bid_placed' | 'outbid' | 'auction_won' | 'auction_ended' | 'payment_required' | 'order_confirmed' | 'order_shipped' | 'product_restock'
  title: string
  message: string
  auction_id?: string
  product_id?: string
  order_id?: string
  is_read: boolean
  created_at: string
  auction?: Auction
  product?: Product
  order?: Order
}

// API Request/Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  full_name: string
  role?: 'bidder' | 'seller'
}

export interface CreateAuctionRequest {
  title: string
  description: string
  category_id: string
  starting_price: number
  reserve_price?: number
  bid_increment: number
  start_time: string
  end_time: string
  condition: 'new' | 'used' | 'refurbished'
  shipping_cost: number
  shipping_methods: string[]
  images?: string[]
}

// Product API request types
export interface CreateProductRequest {
  title: string
  description: string
  category_id: string
  price?: number
  compare_at_price?: number
  cost_price?: number
  sku?: string
  barcode?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  type: 'auction' | 'fixed_price' | 'both'
  stock_quantity?: number
  track_quantity?: boolean
  allow_backorder?: boolean
  requires_shipping?: boolean
  is_taxable?: boolean
  tax_rate?: number
  images?: string[]
  condition?: 'new' | 'used' | 'refurbished'
  brand?: string
  model?: string
  tags?: string[]
  features?: Record<string, unknown>
  specifications?: Record<string, unknown>
  shipping_cost?: number
  shipping_methods?: string[]
  meta_title?: string
  meta_description?: string
  slug?: string
  is_featured?: boolean
  
  // Auction fields (when type includes auction)
  starting_price?: number
  reserve_price?: number
  bid_increment?: number
  auction_start_time?: string
  auction_end_time?: string
  
  // Variants
  variants?: CreateProductVariantRequest[]
}

export interface CreateProductVariantRequest {
  title: string
  price?: number
  compare_at_price?: number
  sku?: string
  barcode?: string
  weight?: number
  stock_quantity?: number
  option1?: string
  option2?: string
  option3?: string
  position?: number
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

// Cart API request types
export interface AddToCartRequest {
  product_id: string
  variant_id?: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

// Order API request types
export interface CreateOrderRequest {
  billing_address: Address
  shipping_address?: Address
  shipping_method?: string
  payment_method: string
  notes?: string
  discount_code?: string
}

export interface UpdateOrderRequest {
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_transaction_id?: string
  tracking_number?: string
  shipping_method?: string
  shipped_at?: string
  delivered_at?: string
  notes?: string
  tags?: string[]
}

// Review API request types
export interface CreateReviewRequest {
  product_id: string
  order_id?: string
  rating: number
  title?: string
  content?: string
}

export interface UpdateReviewRequest {
  rating?: number
  title?: string
  content?: string
}

// Inventory API request types
export interface InventoryAdjustmentRequest {
  product_id?: string
  variant_id?: string
  quantity_change: number
  notes?: string
}

export interface PlaceBidRequest {
  auction_id: string
  amount: number
  is_auto_bid?: boolean
  max_auto_bid?: number
}

export interface SearchFiltersRequest {
  query?: string
  category?: string
  condition?: string
  type?: 'auction' | 'fixed_price' | 'both'
  minPrice?: number
  maxPrice?: number
  brand?: string
  tags?: string[]
  inStock?: boolean
  featured?: boolean
  endingIn?: string
  sortBy?: string
  status?: string
  page?: number
  limit?: number
}

export interface UpdateProfileRequest {
  full_name?: string
  phone?: string
  address?: Record<string, unknown>
  avatar_url?: string
}

// Socket.IO Events
export interface SocketEvents {
  // Auction events
  'bid_placed': {
    auction_id: string
    bid: Bid
    auction: Auction
  }
  'auction_ended': {
    auction_id: string
    auction: Auction
  }
  'outbid_notification': {
    user_id: string
    auction_id: string
    new_bid: Bid
  }
  'auction_updated': {
    auction_id: string
    auction: Auction
  }
  
  // Product events
  'product_updated': {
    product_id: string
    product: Product
  }
  'product_stock_changed': {
    product_id: string
    variant_id?: string
    old_stock: number
    new_stock: number
  }
  'product_price_changed': {
    product_id: string
    variant_id?: string
    old_price: number
    new_price: number
  }
  
  // Order events
  'order_status_updated': {
    order_id: string
    order: Order
    old_status: string
    new_status: string
  }
  'order_shipped': {
    order_id: string
    order: Order
    tracking_number: string
  }
  
  // Cart events
  'cart_updated': {
    user_id: string
    cart: ShoppingCart
  }
  
  // General notifications
  'notification': {
    user_id: string
    notification: Notification
  }
}

// Error Types
export interface ApiError extends Error {
  statusCode: number
  isOperational: boolean
}

// JWT Payload
export interface JwtPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

// File Upload
export interface UploadedFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination: string
  filename: string
  path: string
  size: number
}