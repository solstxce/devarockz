import { Router } from 'express'
import { SellerDashboardController } from '@/controllers/seller-dashboard'
import { authenticateToken, requireSeller } from '@/middleware/auth'
import { validateQuery, validateParams, schemas } from '@/middleware/validation'

const router = Router()
const sellerDashboardController = new SellerDashboardController()

// All routes require seller authentication
router.use(authenticateToken)
router.use(requireSeller)

// Dashboard overview
router.get('/stats', sellerDashboardController.getSellerStats)
router.get('/overview', sellerDashboardController.getDashboardOverview)

// Listings management
router.get('/listings', validateQuery(schemas.sellerListingsQuery), sellerDashboardController.getSellerListings)
router.get('/products', validateQuery(schemas.pagination), sellerDashboardController.getSellerProducts)
router.get('/auctions', validateQuery(schemas.pagination), sellerDashboardController.getSellerAuctions)

// Orders and sales
router.get('/orders', validateQuery(schemas.pagination), sellerDashboardController.getSellerOrders)
router.get('/sales-analytics', sellerDashboardController.getSalesAnalytics)

// Performance metrics
router.get('/performance', sellerDashboardController.getPerformanceMetrics)

export default router