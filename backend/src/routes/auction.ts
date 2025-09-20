import { Router } from 'express'
import { AuctionController } from '@/controllers/auction'
import { authenticateToken, optionalAuth, requireSeller, requireAdmin } from '@/middleware/auth'
import { validateBody, validateQuery, validateParams, schemas } from '@/middleware/validation'
import multer from 'multer'

// Create multer instance for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
    }
  }),
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

const router = Router()
const auctionController = new AuctionController()

// Public routes (with optional auth for user-specific data)
router.get('/search', optionalAuth, validateQuery(schemas.searchAuctions), auctionController.searchAuctions)
router.get('/featured', auctionController.getFeaturedAuctions)
router.get('/:id', optionalAuth, validateParams(schemas.uuidParam), auctionController.getAuction)
router.get('/seller/:sellerId', validateParams(schemas.uuidParam), validateQuery(schemas.pagination), auctionController.getAuctionsBySeller)

// Protected routes - require authentication
router.use(authenticateToken)

// Seller and admin routes
router.post('/',
  requireSeller,
  upload.array('images', 5), // Allow up to 5 images
  auctionController.createAuction
)
router.get('/my/auctions', requireSeller, validateQuery(schemas.pagination), auctionController.getSellerAuctions)
router.put('/:id', requireSeller, validateParams(schemas.uuidParam), validateBody(schemas.updateAuction), auctionController.updateAuction)
router.delete('/:id', requireSeller, validateParams(schemas.uuidParam), auctionController.deleteAuction)
router.post('/:id/activate', requireSeller, validateParams(schemas.uuidParam), auctionController.activateAuction)
router.post('/:id/end', requireSeller, validateParams(schemas.uuidParam), auctionController.endAuction)

// Admin only routes
router.get('/admin/ending', requireAdmin, auctionController.getEndingAuctions)

export default router