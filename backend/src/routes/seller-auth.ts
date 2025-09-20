import { Router } from 'express'
import { SellerAuthController } from '@/controllers/seller-auth'
import { authenticateToken, requireSeller } from '@/middleware/auth'
import { validateBody, schemas } from '@/middleware/validation'

const router = Router()
const sellerAuthController = new SellerAuthController()

// Public routes - seller-specific auth
router.post('/signup', validateBody(schemas.sellerSignup), sellerAuthController.sellerSignup)
router.post('/signin', validateBody(schemas.login), sellerAuthController.sellerSignin)
router.post('/verify-business', validateBody(schemas.verifyBusiness), sellerAuthController.verifyBusiness)

// Protected routes - require seller authentication
router.use(authenticateToken)
router.use(requireSeller)

router.get('/profile', sellerAuthController.getSellerProfile)
router.put('/profile', validateBody(schemas.updateSellerProfile), sellerAuthController.updateSellerProfile)
router.post('/upload-documents', sellerAuthController.uploadBusinessDocuments)
router.get('/verification-status', sellerAuthController.getVerificationStatus)

export default router