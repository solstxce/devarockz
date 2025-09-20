import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

// Import routes
import authRoutes from '@/routes/auth'
import auctionRoutes from '@/routes/auction'
import biddingRoutes from '@/routes/bidding'
import categoryRoutes from '@/routes/category'
import productRoutes from '@/routes/product'
import cartRoutes from '@/routes/cart'
import orderRoutes from '@/routes/order'
import sellerAuthRoutes from '@/routes/seller-auth'
import sellerDashboardRoutes from '@/routes/seller-dashboard'
import postingRoutes from '@/routes/posting'

// Import middleware
import { errorHandler, notFound } from '@/middleware/error'
import { checkDatabaseConnection } from '@/services/database'
import { RealTimeService } from '@/services/realtime'

// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const server = createServer(app)

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Initialize real-time service
const realTimeService = RealTimeService.getInstance()
realTimeService.initialize(io)

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1)

// Security middleware
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Request parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WEBP files are allowed.'))
    }
  }
})

// Create uploads directory if it doesn't exist
import fs from 'fs'
import path from 'path'
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/', limiter)

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'))

// Health check endpoint
app.get('/health', async (req, res) => {
  const isDbConnected = await checkDatabaseConnection()
  
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isDbConnected ? 'connected' : 'disconnected',
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/auctions', auctionRoutes)
app.use('/api/bids', biddingRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)

// Seller-specific routes
app.use('/api/seller/auth', sellerAuthRoutes)
app.use('/api/seller/dashboard', sellerDashboardRoutes)
app.use('/api/seller/postings', postingRoutes)

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join auction rooms for real-time updates
  socket.on('join_auction', (auctionId: string) => {
    socket.join(`auction_${auctionId}`)
    console.log(`User ${socket.id} joined auction ${auctionId}`)
  })

  // Leave auction rooms
  socket.on('leave_auction', (auctionId: string) => {
    socket.leave(`auction_${auctionId}`)
    console.log(`User ${socket.id} left auction ${auctionId}`)
  })

  // Join product rooms for inventory updates
  socket.on('join_product', (productId: string) => {
    socket.join(`product_${productId}`)
    console.log(`User ${socket.id} joined product ${productId}`)
  })

  // Leave product rooms
  socket.on('leave_product', (productId: string) => {
    socket.leave(`product_${productId}`)
    console.log(`User ${socket.id} left product ${productId}`)
  })

  // Join user-specific room for personal notifications
  socket.on('join_user', (userId: string) => {
    socket.join(`user_${userId}`)
    console.log(`User ${socket.id} joined user room ${userId}`)
  })

  // Leave user rooms
  socket.on('leave_user', (userId: string) => {
    socket.leave(`user_${userId}`)
    console.log(`User ${socket.id} left user room ${userId}`)
  })

  // Join category rooms for category-specific updates
  socket.on('join_category', (categoryId: string) => {
    socket.join(`category_${categoryId}`)
    console.log(`User ${socket.id} joined category ${categoryId}`)
  })

  // Leave category rooms
  socket.on('leave_category', (categoryId: string) => {
    socket.leave(`category_${categoryId}`)
    console.log(`User ${socket.id} left category ${categoryId}`)
  })

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Store io instance and realtime service for use in other modules
app.set('io', io)
app.set('realtime', realTimeService)

// 404 handler
app.use(notFound)

// Global error handler
app.use(errorHandler)

// Server configuration
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'

// Start server
const startServer = async () => {
  try {
    // Check database connection
    const isDbConnected = await checkDatabaseConnection()
    if (!isDbConnected) {
      console.error('Failed to connect to database')
      process.exit(1)
    }

    server.listen(PORT, () => {
      console.log(`
🚀 AuctionHub Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running in ${NODE_ENV} mode
🌐 Port: ${PORT}
📊 Database: Connected
🔌 Socket.IO: Enabled
🛡️  Security: Enabled (Helmet, CORS, Rate Limiting)
📝 API Documentation: http://localhost:${PORT}/api
🏥 Health Check: http://localhost:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `)
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully')
      server.close(() => {
        console.log('Process terminated')
      })
    })

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully')
      server.close(() => {
        console.log('Process terminated')
      })
    })

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Export the io instance and realtime service for use in other modules
export { io, realTimeService }

// Start the server
startServer()

export default app