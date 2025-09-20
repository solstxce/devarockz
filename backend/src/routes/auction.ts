import { Router } from 'express'
import { AuctionController } from '@/controllers/auction'
import { authenticateToken, optionalAuth, requireSeller, requireAdmin } from '@/middleware/auth'
import { validateBody, validateQuery, validateParams, schemas } from '@/middleware/validation'

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
router.post('/', requireSeller, validateBody(schemas.createAuction), auctionController.createAuction)
router.get('/my/auctions', requireSeller, validateQuery(schemas.pagination), auctionController.getSellerAuctions)
router.put('/:id', requireSeller, validateParams(schemas.uuidParam), validateBody(schemas.updateAuction), auctionController.updateAuction)
router.delete('/:id', requireSeller, validateParams(schemas.uuidParam), auctionController.deleteAuction)
router.post('/:id/activate', requireSeller, validateParams(schemas.uuidParam), auctionController.activateAuction)
router.post('/:id/end', requireSeller, validateParams(schemas.uuidParam), auctionController.endAuction)

// Admin only routes
router.get('/admin/ending', requireAdmin, auctionController.getEndingAuctions)

export default router