# E-commerce Auction Platform Specification

## 1. Project Overview

### 1.1 Purpose
An online auction platform that enables users to buy and sell items through bidding mechanisms, with real-time bid tracking and comprehensive auction management.

### 1.2 Core Features
- User authentication and role-based access control
- Real-time auction bidding system
- Item listing and management
- Bid tracking and history
- Payment processing integration
- Admin dashboard for platform management

### 1.3 Technology Stack
- **Backend**: Supabase (PostgreSQL, Auth, Real-time subscriptions)
- **Frontend**: React.js
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Real-time subscriptions
- **Storage**: Supabase Storage (for images)
- **Payment**: Razorpay integration

## 2. User Roles & Permissions

### 2.1 Bidder
- Browse and search auctions
- Place bids on active auctions
- View bid history
- Manage profile and payment methods
- Receive notifications for outbid alerts
- View won auctions and payment status

### 2.2 Seller
- Create and manage auction listings
- Upload product images and descriptions
- Set starting prices and auction duration
- Monitor bid activity on their items
- Manage inventory and sales history
- Process completed sales

### 2.3 Admin
- Manage all users and their permissions
- Monitor all auction activities
- Handle disputes and reports
- Manage platform settings
- Generate analytics and reports
- Moderate content and listings

## 3. Database Schema

### 3.1 Core Tables

#### users (extends Supabase auth.users)
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- role (ENUM: 'bidder', 'seller', 'admin')
- full_name (String)
- avatar_url (String)
- phone (String)
- address (JSON)
- created_at (Timestamp)
- updated_at (Timestamp)
- is_verified (Boolean)
- is_active (Boolean)
```

#### categories
```sql
- id (UUID, Primary Key)
- name (String, Unique)
- description (Text)
- parent_id (UUID, Foreign Key to categories.id)
- is_active (Boolean)
- created_at (Timestamp)
```

#### auctions
```sql
- id (UUID, Primary Key)
- seller_id (UUID, Foreign Key to users.id)
- category_id (UUID, Foreign Key to categories.id)
- title (String)
- description (Text)
- starting_price (Decimal)
- reserve_price (Decimal, Optional)
- current_bid (Decimal, Default: starting_price)
- bid_increment (Decimal)
- start_time (Timestamp)
- end_time (Timestamp)
- status (ENUM: 'draft', 'active', 'completed', 'cancelled')
- winner_id (UUID, Foreign Key to users.id, Nullable)
- total_bids (Integer, Default: 0)
- images (Array of Strings)
- condition (ENUM: 'new', 'used', 'refurbished')
- shipping_cost (Decimal)
- shipping_methods (Array of Strings)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### bids
```sql
- id (UUID, Primary Key)
- auction_id (UUID, Foreign Key to auctions.id)
- bidder_id (UUID, Foreign Key to users.id)
- amount (Decimal)
- is_auto_bid (Boolean, Default: false)
- max_auto_bid (Decimal, Nullable)
- created_at (Timestamp)
- ip_address (String)
```

#### watchlist
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users.id)
- auction_id (UUID, Foreign Key to auctions.id)
- created_at (Timestamp)
- UNIQUE(user_id, auction_id)
```

#### transactions
```sql
- id (UUID, Primary Key)
- auction_id (UUID, Foreign Key to auctions.id)
- buyer_id (UUID, Foreign Key to users.id)
- seller_id (UUID, Foreign Key to users.id)
- final_amount (Decimal)
- payment_status (ENUM: 'pending', 'completed', 'failed', 'refunded')
- payment_method (String)
- stripe_payment_intent_id (String)
- shipping_status (ENUM: 'pending', 'shipped', 'delivered')
- tracking_number (String, Nullable)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### notifications
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users.id)
- type (ENUM: 'bid_placed', 'outbid', 'auction_won', 'auction_ended', 'payment_required')
- title (String)
- message (Text)
- auction_id (UUID, Foreign Key to auctions.id, Nullable)
- is_read (Boolean, Default: false)
- created_at (Timestamp)
```

## 4. Page Specifications

### 4.1 Bidder Dashboard

#### 4.1.1 Main Features
- **Active Bids**: List of ongoing auctions where user has placed bids
- **Watchlist**: Saved auctions for future bidding
- **Bid History**: Complete history of all bids placed
- **Won Auctions**: Auctions won and payment status
- **Notifications**: Real-time alerts for outbids, auction endings

#### 4.1.2 Components
- Auction card with live bid information
- Quick bid functionality
- Search and filter options
- Bid amount input with validation
- Auto-bid setup
- Payment integration for won items

#### 4.1.3 Real-time Features
- Live bid updates
- Time remaining countdown
- Instant outbid notifications
- Auto-refresh auction status

### 4.2 Seller Dashboard

#### 4.2.1 Main Features
- **Create Auction**: Form to list new items
- **Active Auctions**: Currently running auctions with bid activity
- **Completed Sales**: History of sold items
- **Draft Listings**: Unpublished auction drafts
- **Analytics**: Performance metrics and insights

#### 4.2.2 Components
- Auction creation wizard
- Image upload and management
- Pricing and duration settings
- Bid monitoring dashboard
- Sales analytics charts
- Inventory management tools

#### 4.2.3 Key Functionalities
- Bulk image upload
- Auction scheduling
- Reserve price setting
- Shipping calculator
- Performance tracking

### 4.3 Admin Dashboard

#### 4.3.1 Main Features

- **User Management**: View, suspend, and manage all users
- **Auction Oversight**: Monitor all platform auctions
- **Reports & Analytics**: Platform-wide statistics
- **Content Moderation**: Review flagged content
- **System Settings**: Configure platform parameters

#### 4.3.2 Components
- User search and filter system
- Auction monitoring tools
- Revenue and activity analytics
- Content approval workflow
- System configuration panel

#### 4.3.3 Administrative Tools
- User verification system
- Dispute resolution interface
- Automated rule enforcement
- Performance monitoring
- Backup and maintenance tools

## 5. API Endpoints

### 5.1 Authentication (Supabase Auth)
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/reset-password` - Password reset

### 5.2 Auctions
- `GET /api/auctions` - List auctions with filters
- `POST /api/auctions` - Create new auction
- `GET /api/auctions/:id` - Get auction details
- `PUT /api/auctions/:id` - Update auction
- `DELETE /api/auctions/:id` - Cancel auction

### 5.3 Bidding
- `POST /api/auctions/:id/bids` - Place bid
- `GET /api/auctions/:id/bids` - Get bid history
- `POST /api/auctions/:id/watch` - Add to watchlist
- `DELETE /api/auctions/:id/watch` - Remove from watchlist

### 5.4 User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/bids` - Get user's bid history
- `GET /api/users/auctions` - Get user's auctions

### 5.5 Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user status
- `GET /api/admin/analytics` - Platform analytics
- `GET /api/admin/reports` - Generate reports

## 6. Real-time Features

### 6.1 Supabase Real-time Subscriptions
- **Bid Updates**: Live bid amount and bidder count
- **Auction Status**: Real-time status changes
- **Notifications**: Instant user notifications
- **Time Updates**: Live countdown timers

### 6.2 WebSocket Events
- `bid_placed` - New bid on auction
- `auction_ended` - Auction completion
- `outbid_notification` - User outbid alert
- `auction_updated` - Auction details changed

## 7. Security & Validation

### 7.1 Authentication Security
- JWT token validation
- Role-based access control (RLS in Supabase)
- Session management
- Password strength requirements

### 7.2 Bid Validation
- Minimum bid increment enforcement
- Auction timing validation
- Duplicate bid prevention
- Auto-bid limit checks

### 7.3 Data Protection
- Input sanitization
- SQL injection prevention
- XSS protection
- Rate limiting on API endpoints

## 8. Payment Integration

### 8.1 Stripe Integration
- Payment intent creation
- Secure card processing
- Webhook handling
- Refund processing

### 8.2 Payment Flow
1. Auction ends with winner determined
2. Payment intent created for final amount
3. Buyer completes payment
4. Funds held until item shipped
5. Automatic release to seller

## 9. Performance Considerations

### 9.1 Optimization Strategies
- Database indexing on frequently queried fields
- Image compression and CDN usage
- Pagination for large data sets
- Caching for auction listings
- Connection pooling for database

### 9.2 Scalability Features
- Horizontal scaling with Supabase
- Load balancing for high traffic
- Background job processing
- Real-time connection management
