import { Router } from 'express'
import { AuthController } from '@/controllers/auth'
import { authenticateToken } from '@/middleware/auth'
import { validateBody, schemas } from '@/middleware/validation'

const router = Router()
const authController = new AuthController()

// Public routes
router.post('/signup', validateBody(schemas.signup), authController.signup)
router.post('/signin', validateBody(schemas.login), authController.signin)
router.post('/forgot-password', validateBody(schemas.forgotPassword), authController.resetPassword)

// Protected routes
router.use(authenticateToken)
router.get('/profile', authController.getProfile)
router.put('/profile', validateBody(schemas.updateProfile), authController.updateProfile)
router.post('/change-password', validateBody(schemas.changePassword), authController.changePassword)
router.post('/signout', authController.signout)
router.get('/verify', authController.verifyToken)

export default router