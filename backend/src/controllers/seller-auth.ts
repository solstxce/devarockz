import { Request, Response } from 'express'
import { AuthService } from '@/services/auth'
import { SellerService } from '@/services/seller'
import { AppError, asyncHandler } from '@/middleware/error'
import type { LoginRequest, ApiResponse, User } from '@/types'

export interface SellerSignupRequest {
  email: string
  password: string
  full_name: string
  business_name: string
  business_type: 'individual' | 'company' | 'partnership'
  phone: string
  business_address: {
    street: string
    city: string
    state: string
    zip_code: string
    country: string
  }
  tax_id?: string
  role: 'seller'
}

export interface VerifyBusinessRequest {
  business_license: string
  tax_document?: string
  identity_document: string
  additional_documents?: string[]
}

export class SellerAuthController {
  private authService: AuthService
  private sellerService: SellerService

  constructor() {
    this.authService = AuthService.getInstance()
    this.sellerService = SellerService.getInstance()
  }

  // Seller-specific signup with business information
  sellerSignup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const sellerData: SellerSignupRequest = req.body

    // Create user account with seller role
    const { user, token } = await this.authService.signUp({
      email: sellerData.email,
      password: sellerData.password,
      full_name: sellerData.full_name,
      role: 'seller'
    })

    // Create seller profile with business information
    const sellerProfile = await this.sellerService.createSellerProfile(user.id, {
      business_name: sellerData.business_name,
      business_type: sellerData.business_type,
      phone: sellerData.phone,
      business_address: sellerData.business_address,
      ...(sellerData.tax_id && { tax_id: sellerData.tax_id })
    })

    res.status(201).json({
      success: true,
      message: 'Seller account created successfully',
      data: {
        user,
        seller_profile: sellerProfile,
        token
      }
    } as ApiResponse<{ user: User; seller_profile: any; token: string }>)
  })

  // Seller-specific signin with seller role validation
  sellerSignin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const credentials: LoginRequest = req.body

    const { user, token } = await this.authService.signIn(credentials)

    // Verify user is a seller
    if (user.role !== 'seller') {
      throw new AppError('Access denied. Seller account required.', 403)
    }

    // Get seller profile
    const sellerProfile = await this.sellerService.getSellerProfile(user.id)

    res.status(200).json({
      success: true,
      message: 'Seller signed in successfully',
      data: {
        user,
        seller_profile: sellerProfile,
        token
      }
    } as ApiResponse<{ user: User; seller_profile: any; token: string }>)
  })

  // Get seller profile with business information
  getSellerProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const sellerProfile = await this.sellerService.getSellerProfile(req.user.id)

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        seller_profile: sellerProfile
      }
    } as ApiResponse<{ user: User; seller_profile: any }>)
  })

  // Update seller profile
  updateSellerProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const updateData = req.body
    const updatedProfile = await this.sellerService.updateSellerProfile(req.user.id, updateData)

    res.status(200).json({
      success: true,
      message: 'Seller profile updated successfully',
      data: updatedProfile
    } as ApiResponse<any>)
  })

  // Submit business verification documents
  verifyBusiness = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const documents: VerifyBusinessRequest = req.body
    const verification = await this.sellerService.submitBusinessVerification(req.user.id, documents)

    res.status(200).json({
      success: true,
      message: 'Business verification documents submitted successfully',
      data: verification
    } as ApiResponse<any>)
  })

  // Upload business documents (file handling)
  uploadBusinessDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    // This would handle file uploads - placeholder for now
    res.status(200).json({
      success: true,
      message: 'Document upload endpoint - implementation pending',
      data: { uploaded_files: [] }
    } as ApiResponse<{ uploaded_files: string[] }>)
  })

  // Get business verification status
  getVerificationStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'seller') {
      throw new AppError('Seller authentication required', 401)
    }

    const status = await this.sellerService.getVerificationStatus(req.user.id)

    res.status(200).json({
      success: true,
      data: status
    } as ApiResponse<any>)
  })
}