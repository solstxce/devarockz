import { Request, Response, NextFunction } from 'express'
import { AuthService } from '@/services/auth'
import type { JwtPayload, User } from '@/types'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
      userId?: string
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      })
      return
    }

    const authService = AuthService.getInstance()
    const payload: JwtPayload | null = authService.verifyToken(token)

    if (!payload) {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      })
      return
    }

    // Get fresh user data
    const user = await authService.getUserById(payload.userId)
    
    if (!user || !user.is_active) {
      res.status(403).json({
        success: false,
        error: 'User account is inactive'
      })
      return
    }

    req.user = user
    req.userId = user.id
    next()
  } catch {
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const authService = AuthService.getInstance()
      const payload: JwtPayload | null = authService.verifyToken(token)

      if (payload) {
        const user = await authService.getUserById(payload.userId)
        if (user && user.is_active) {
          req.user = user
          req.userId = user.id
        }
      }
    }

    next()
  } catch {
    // Continue without authentication for optional auth
    next()
  }
}

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
      return
    }

    next()
  }
}

export const requireSeller = requireRole('seller', 'admin')
export const requireAdmin = requireRole('admin')