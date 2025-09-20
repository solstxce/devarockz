import { Router } from 'express'
import { CartController } from '@/controllers/cart'
import { authenticateToken } from '@/middleware/auth'

const router = Router()
const cartController = new CartController()

// All cart routes require authentication
router.use(authenticateToken)

// Cart management
router.get('/', cartController.getCart)
router.post('/items', cartController.addToCart)
router.put('/items/:itemId', cartController.updateCartItem)
router.delete('/items/:itemId', cartController.removeCartItem)
router.delete('/', cartController.clearCart)

// Cart utilities
router.get('/summary', cartController.getCartSummary)
router.get('/validate', cartController.validateCart)

export default router