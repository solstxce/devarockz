import { Router } from 'express'
import { BiddingController } from '@/controllers/bidding'
import { authenticateToken, optionalAuth } from '@/middleware/auth'
import { validateBody, validateQuery, validateParams, schemas } from '@/middleware/validation'

const router = Router()
const biddingController = new BiddingController()

// Public routes (with optional auth)
router.get('/auction/:auctionId', optionalAuth, validateParams(schemas.auctionIdParam), validateQuery(schemas.pagination), biddingController.getAuctionBids)
router.get('/auction/:auctionId/highest', optionalAuth, validateParams(schemas.auctionIdParam), biddingController.getHighestBid)
router.get('/auction/:auctionId/statistics', optionalAuth, validateParams(schemas.auctionIdParam), biddingController.getBidStatistics)

// Protected routes - require authentication
router.use(authenticateToken)

router.post('/', validateBody(schemas.placeBid), biddingController.placeBid)
router.get('/my/bids', validateQuery(schemas.pagination), biddingController.getUserBids)
router.get('/my/active', biddingController.getUserActiveBids)
router.get('/my/won', validateQuery(schemas.pagination), biddingController.getUserWonAuctions)
router.get('/auction/:auctionId/is-highest', validateParams(schemas.auctionIdParam), biddingController.isHighestBidder)

export default router