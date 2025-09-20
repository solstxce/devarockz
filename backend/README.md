# AuctionHub Backend API

REST API backend for the AuctionHub e-commerce auction platform built with Node.js, Express, TypeScript, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Supabase account and project

### Installation

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your credentials:
   ```env
   NODE_ENV=development
   PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Database setup**
   - Run the SQL schema from `../supabase-schema.sql` in your Supabase project

4. **Start development server**
   ```bash
   bun run dev
   ```

The API will be available at `http://localhost:3001`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/change-password` - Change password

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/with-counts` - Get categories with auction counts
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Auctions
- `GET /api/auctions/search` - Search auctions with filters
- `GET /api/auctions/featured` - Get featured auctions
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions` - Create auction (seller)
- `PUT /api/auctions/:id` - Update auction (seller)
- `DELETE /api/auctions/:id` - Delete auction (seller)
- `POST /api/auctions/:id/activate` - Activate auction (seller)
- `POST /api/auctions/:id/end` - End auction (seller)

### Bidding
- `POST /api/bids` - Place a bid
- `GET /api/bids/auction/:auctionId` - Get auction bids
- `GET /api/bids/my/bids` - Get user's bids
- `GET /api/bids/my/active` - Get user's active bids
- `GET /api/bids/my/won` - Get user's won auctions

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + Supabase Auth
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

### Project Structure
```
src/
├── controllers/     # Route handlers
├── services/        # Business logic
├── routes/          # API routes
├── middleware/      # Custom middleware
├── types/           # TypeScript types
├── utils/           # Helper functions
└── index.ts         # Server entry point
```

### Key Features
- **Type Safety**: Full TypeScript implementation
- **Security**: JWT authentication, input validation, rate limiting
- **Real-time**: Socket.IO for live bid updates
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Validation**: Request validation using Joi schemas
- **Database**: Supabase integration with type-safe queries

## 🔒 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

### User Roles
- **bidder**: Can browse and bid on auctions
- **seller**: Can create and manage auctions + bidder permissions
- **admin**: Full platform access + all other permissions

## 🗄️ Database Schema

See `../supabase-schema.sql` for the complete database schema including:
- Users and authentication
- Auction listings
- Bidding system
- Categories
- Transactions
- Notifications

## 🚦 API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {...},
  "message": "Optional message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:5173` |
| `RAZORPAY_KEY_ID` | Razorpay key ID | Required |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | Required |

## 🧪 Testing

```bash
# Run tests
bun test

# Run tests in watch mode
bun test --watch
```

## 📦 Building for Production

```bash
# Build TypeScript
bun run build

# Start production server
bun start
```

## 🔍 Health Check

The API includes a health check endpoint at `/health` that returns:
- Server status
- Database connectivity
- Uptime information

## 🚀 Deployment

The backend can be deployed to any Node.js hosting service:

1. **Build the project**: `bun run build`
2. **Set environment variables** in your hosting service
3. **Start the server**: `bun start`

Recommended platforms:
- Railway
- Render
- Heroku
- DigitalOcean App Platform

## 📄 License

MIT License - see the [LICENSE](../LICENSE) file for details.