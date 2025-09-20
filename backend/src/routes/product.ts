import { Router } from 'express'
import { ProductController } from '@/controllers/product'
import { authenticateToken, requireRole, requireSeller } from '@/middleware/auth'

const router = Router()
const productController = new ProductController()

// Public routes
router.get('/search', productController.searchProducts)
router.get('/featured', productController.getFeaturedProducts)
router.get('/category/:categoryId', productController.getProductsByCategory)
router.get('/seller/:sellerId', productController.getProductsBySeller)
router.get('/slug/:slug', productController.getProductBySlug)
router.get('/:id', productController.getProduct)

// Protected routes (require authentication)
router.use(authenticateToken)

// Seller/Admin routes
router.post('/', requireSeller, productController.createProduct)
router.get('/my/products', requireSeller, productController.getSellerProducts)
router.put('/:id', requireSeller, productController.updateProduct)
router.delete('/:id', requireSeller, productController.deleteProduct)

// Variant management
router.put('/variants/:variantId', requireSeller, productController.updateProductVariant)
router.delete('/variants/:variantId', requireSeller, productController.deleteProductVariant)

// Inventory management
router.post('/inventory/adjust', requireSeller, productController.adjustInventory)
router.get('/inventory/movements', requireSeller, productController.getInventoryMovements)
router.get('/inventory/low-stock', requireSeller, productController.getLowStockProducts)

// Bulk operations
router.patch('/bulk/update', requireSeller, productController.bulkUpdateProducts)

export default router