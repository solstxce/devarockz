# AuctionHub Backend API - Extended Ecommerce Features

This backend now supports both auction-based and regular ecommerce functionality with real-time features.

## 🚀 New Features Added

### 1. **Product Management System**
- Support for both auction and fixed-price products
- Product variants (size, color, etc.)
- Inventory tracking with automatic stock updates
- Advanced search and filtering
- Bulk operations for sellers

### 2. **Shopping Cart System**
- Add/remove/update cart items
- Real-time cart synchronization
- Cart validation before checkout
- Support for product variants

### 3. **Order Management System**
- Complete order lifecycle management
- Order status tracking (pending → confirmed → shipped → delivered)
- Automatic inventory deduction on order confirmation
- Order statistics and analytics

### 4. **Real-time Features**
- Live product updates
- Inventory change notifications
- Order status updates
- Cart synchronization
- Auction bidding (existing)

## 📊 Database Schema Extensions

The database now includes additional tables:
- `products` - Regular ecommerce products + auction items
- `product_variants` - Product variations (size, color, etc.)
- `shopping_cart` & `cart_items` - Shopping cart functionality
- `orders` & `order_items` - Order management
- `inventory_movements` - Stock tracking
- `product_reviews` - Customer reviews
- `wishlist` - User wishlists
- `discounts` - Coupon/discount system

## 🔗 API Endpoints

### Product Endpoints (`/api/products`)

#### Public Routes
```
GET    /api/products/search           # Search products with filters
GET    /api/products/featured         # Get featured products
GET    /api/products/category/:id     # Get products by category
GET    /api/products/seller/:id       # Get products by seller
GET    /api/products/slug/:slug       # Get product by slug
GET    /api/products/:id              # Get product details
```

#### Authenticated Routes (Seller/Admin)
```
POST   /api/products                  # Create new product
GET    /api/products/my/products      # Get seller's products
PUT    /api/products/:id              # Update product
DELETE /api/products/:id              # Delete product
PUT    /api/products/variants/:id     # Update product variant
DELETE /api/products/variants/:id     # Delete product variant
```

#### Inventory Management
```
POST   /api/products/inventory/adjust     # Adjust inventory
GET    /api/products/inventory/movements  # Get inventory history
GET    /api/products/inventory/low-stock  # Get low stock products
PATCH  /api/products/bulk/update          # Bulk update products
```

### Cart Endpoints (`/api/cart`)

All cart routes require authentication.

```
GET    /api/cart                      # Get user's cart
POST   /api/cart/items                # Add item to cart
PUT    /api/cart/items/:itemId        # Update cart item quantity
DELETE /api/cart/items/:itemId        # Remove item from cart
DELETE /api/cart                      # Clear cart
GET    /api/cart/summary              # Get cart summary with totals
GET    /api/cart/validate             # Validate cart before checkout
```

### Order Endpoints (`/api/orders`)

#### Customer Routes
```
POST   /api/orders                    # Create order from cart
GET    /api/orders/my                 # Get user's orders
GET    /api/orders/statistics         # Get order statistics
GET    /api/orders/:id                # Get order details
PUT    /api/orders/:id/cancel         # Cancel order
```

#### Admin/Seller Routes
```
GET    /api/orders                    # Get all orders (admin)
PUT    /api/orders/:id                # Update order (admin)
PUT    /api/orders/:id/confirm        # Confirm order payment
PUT    /api/orders/:id/ship           # Ship order
PUT    /api/orders/:id/deliver        # Mark as delivered
```

## 🔍 Search & Filtering

The search endpoint supports extensive filtering:

```javascript
GET /api/products/search?query=laptop&category=electronics&minPrice=500&maxPrice=2000&brand=apple&inStock=true&featured=true&sortBy=price_desc&page=1&limit=20
```

### Available Filters:
- `query` - Text search in title, description, brand
- `category` - Filter by category ID
- `condition` - new, used, refurbished
- `type` - auction, fixed_price, both
- `minPrice` / `maxPrice` - Price range
- `brand` - Filter by brand
- `tags` - Filter by tags array
- `inStock` - Only show items in stock
- `featured` - Only show featured products
- `sortBy` - created_at, price_asc, price_desc, title, featured

## 🛒 Cart Operations

### Add to Cart
```javascript
POST /api/cart/items
{
  \"product_id\": \"uuid\",
  \"variant_id\": \"uuid\", // optional
  \"quantity\": 2
}
```

### Update Cart Item
```javascript
PUT /api/cart/items/:itemId
{
  \"quantity\": 3
}
```

## 📦 Order Creation

### Create Order
```javascript
POST /api/orders
{
  \"billing_address\": {
    \"first_name\": \"John\",
    \"last_name\": \"Doe\",
    \"address1\": \"123 Main St\",
    \"city\": \"New York\",
    \"province\": \"NY\",
    \"country\": \"US\",
    \"zip\": \"10001\",
    \"phone\": \"+1234567890\"
  },
  \"shipping_address\": { /* same structure or omit to use billing */ },
  \"payment_method\": \"credit_card\",
  \"shipping_method\": \"standard\",
  \"notes\": \"Leave at door\",
  \"discount_code\": \"SAVE10\"
}
```

## 🔄 Real-time Events

### Socket.IO Events

#### Product Events
- `product_updated` - Product information changed
- `product_stock_changed` - Inventory levels changed
- `product_price_changed` - Price updated
- `low_stock_alert` - Stock below threshold

#### Order Events
- `order_status_updated` - Order status changed
- `order_shipped` - Order shipped with tracking
- `order_delivered` - Order delivered

#### Cart Events
- `cart_updated` - Cart contents changed

#### General Events
- `notification` - User-specific notifications

### Joining Rooms
```javascript
// Join product room for updates
socket.emit('join_product', productId)

// Join user room for personal notifications
socket.emit('join_user', userId)

// Join category room for category updates
socket.emit('join_category', categoryId)
```

## 📈 Inventory Management

### Automatic Stock Tracking
- Stock automatically decreases when orders are confirmed
- Inventory movements are logged for audit trail
- Low stock alerts when items reach threshold
- Support for product variants with individual stock levels

### Manual Inventory Adjustments
```javascript
POST /api/products/inventory/adjust
{
  \"product_id\": \"uuid\",
  \"variant_id\": \"uuid\", // optional
  \"quantity_change\": -5,   // negative for reductions
  \"notes\": \"Damaged items removed\"
}
```

## 🎯 Product Types

### Fixed Price Products
```javascript
{
  \"type\": \"fixed_price\",
  \"price\": 29.99,
  \"stock_quantity\": 100
}
```

### Auction Products
```javascript
{
  \"type\": \"auction\",
  \"starting_price\": 1.00,
  \"bid_increment\": 0.50,
  \"auction_start_time\": \"2023-12-01T00:00:00Z\",
  \"auction_end_time\": \"2023-12-07T23:59:59Z\"
}
```

### Hybrid Products (Both)
```javascript
{
  \"type\": \"both\",
  \"price\": 49.99,           // Buy it now price
  \"starting_price\": 25.00,  // Auction starting price
  \"auction_start_time\": \"2023-12-01T00:00:00Z\",
  \"auction_end_time\": \"2023-12-07T23:59:59Z\"
}
```

## 🔐 Authentication & Authorization

### User Roles
- **bidder** - Can browse, bid, purchase, and manage orders
- **seller** - Can create/manage products, view sales analytics
- **admin** - Full access to all features and management

### Route Protection
- Public routes: Product browsing, search, category listings
- Authenticated routes: Cart, orders, product creation
- Role-based routes: Admin panel, seller dashboard, inventory management

## 📱 Frontend Integration

### Example React Hook for Real-time Cart
```javascript
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const useCart = (userId) => {
  const [cart, setCart] = useState(null)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const newSocket = io('http://localhost:3001')
    setSocket(newSocket)

    // Join user room for cart updates
    newSocket.emit('join_user', userId)

    // Listen for cart updates
    newSocket.on('cart_updated', (event) => {
      if (event.user_id === userId) {
        setCart(event.cart)
      }
    })

    return () => newSocket.close()
  }, [userId])

  return { cart, socket }
}
```

## 🚦 Getting Started

1. **Apply Database Schema**
   ```bash
   # Apply the extended schema
   psql -d your_database -f supabase-products-schema.sql
   ```

2. **Environment Variables**
   ```env
   # Add to your .env file
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Start the Server**
   ```bash
   bun run dev
   ```

4. **Test the API**
   ```bash
   # Get featured products
   curl http://localhost:3001/api/products/featured
   
   # Search products
   curl \"http://localhost:3001/api/products/search?query=electronics&page=1&limit=10\"
   ```

The backend now provides a complete ecommerce solution with both auction and traditional shopping capabilities, real-time updates, and comprehensive inventory management!