import { Router } from 'express'
import { OrderController } from '@/controllers/order'
import { authenticateToken, requireRole } from '@/middleware/auth'

const router = Router()
const orderController = new OrderController()

// All order routes require authentication
router.use(authenticateToken)

// Customer order routes
router.post('/', orderController.createOrder)
router.get('/my', orderController.getUserOrders)
router.get('/statistics', orderController.getOrderStatistics)
router.get('/:id', orderController.getOrder)
router.put('/:id/cancel', orderController.cancelOrder)

// Admin/Seller routes
router.get('/', requireRole('admin'), orderController.getAllOrders)
router.put('/:id', requireRole('admin'), orderController.updateOrder)
router.put('/:id/confirm', requireRole('admin'), orderController.confirmOrder)
router.put('/:id/ship', requireRole('admin', 'seller'), orderController.shipOrder)
router.put('/:id/deliver', requireRole('admin'), orderController.deliverOrder)

export default router