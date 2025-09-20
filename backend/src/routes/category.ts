import { Router } from 'express'
import { CategoryController } from '@/controllers/category'
import { authenticateToken, requireAdmin } from '@/middleware/auth'
import { validateBody, validateParams, schemas } from '@/middleware/validation'

const router = Router()
const categoryController = new CategoryController()

// Public routes
router.get('/', categoryController.getAllCategories)
router.get('/with-counts', categoryController.getCategoriesWithCounts)
router.get('/parents', categoryController.getParentCategories)
router.get('/:id', validateParams(schemas.uuidParam), categoryController.getCategory)
router.get('/:parentId/subcategories', validateParams(schemas.uuidParam), categoryController.getSubcategories)

// Admin only routes
router.use(authenticateToken)
router.use(requireAdmin)

// Add validation schemas for category operations
const createCategorySchema = {
  name: require('joi').string().min(2).max(100).required(),
  description: require('joi').string().max(500).optional(),
  parent_id: require('joi').string().uuid().optional(),
  is_active: require('joi').boolean().optional()
}

const updateCategorySchema = {
  name: require('joi').string().min(2).max(100).optional(),
  description: require('joi').string().max(500).optional(),
  parent_id: require('joi').string().uuid().optional().allow(null),
  is_active: require('joi').boolean().optional()
}

router.post('/', validateBody(require('joi').object(createCategorySchema)), categoryController.createCategory)
router.put('/:id', validateParams(schemas.uuidParam), validateBody(require('joi').object(updateCategorySchema)), categoryController.updateCategory)
router.delete('/:id', validateParams(schemas.uuidParam), categoryController.deleteCategory)

export default router