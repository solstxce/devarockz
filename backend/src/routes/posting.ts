import { Router } from 'express'
import { PostingController } from '@/controllers/posting-simple'
import { authenticateToken, requireSeller } from '@/middleware/auth'
import { validateBody, validateParams, schemas } from '@/middleware/validation'

const router = Router()
const postingController = new PostingController()

// All routes require seller authentication
router.use(authenticateToken)
router.use(requireSeller)

// Create new posting (product or auction)
router.post('/', validateBody(schemas.createPosting), postingController.createPosting)

// Get posting by ID
router.get('/:id', validateParams(schemas.uuidParam), postingController.getPosting)

// Update posting
router.put('/:id', validateParams(schemas.uuidParam), validateBody(schemas.updatePosting), postingController.updatePosting)

// Delete posting
router.delete('/:id', validateParams(schemas.uuidParam), postingController.deletePosting)

// Change posting status (activate, deactivate, etc.)
router.patch('/:id/status', validateParams(schemas.uuidParam), validateBody(schemas.updatePostingStatus), postingController.updatePostingStatus)

// Convert product to auction
router.post('/:id/convert-to-auction', validateParams(schemas.uuidParam), validateBody(schemas.convertToAuction), postingController.convertToAuction)

export default router