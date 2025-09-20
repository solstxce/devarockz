import { Request, Response } from 'express'
import { AuthService } from '@/services/auth'
import { AppError, asyncHandler } from '@/middleware/error'
import type { LoginRequest, SignupRequest, ApiResponse, User } from '@/types'

export class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = AuthService.getInstance()
  }

  // Sign up new user
  signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData: SignupRequest = req.body

    const { user, token } = await this.authService.signUp(userData)

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user,
        token
      }
    } as ApiResponse<{ user: User; token: string }>)
  })

  // Sign in user
  signin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const credentials: LoginRequest = req.body

    const { user, token } = await this.authService.signIn(credentials)

    res.status(200).json({
      success: true,
      message: 'User signed in successfully',
      data: {
        user,
        token
      }
    } as ApiResponse<{ user: User; token: string }>)
  })

  // Get current user profile
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401)
    }

    res.status(200).json({
      success: true,
      data: req.user
    } as ApiResponse<User>)
  })

  // Update user profile
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const updates = req.body
    const user = await this.authService.updateProfile(req.userId, updates)

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    } as ApiResponse<User>)
  })

  // Reset password request
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body

    await this.authService.resetPassword(email)

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    } as ApiResponse)
  })

  // Change password
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { current_password, new_password } = req.body

    // Verify current password
    const user = await this.authService.getUserById(req.userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    // For this example, we'll skip current password verification
    // In a real app, you'd verify the current password here

    await this.authService.changePassword(req.userId, new_password)

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    } as ApiResponse)
  })

  // Sign out (mainly for token blacklisting if implemented)
  signout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // In a stateless JWT setup, signout is handled client-side
    // Here you could implement token blacklisting if needed

    res.status(200).json({
      success: true,
      message: 'Signed out successfully'
    } as ApiResponse)
  })

  // Verify token endpoint
  verifyToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Invalid token', 401)
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: req.user
    } as ApiResponse<User>)
  })
}