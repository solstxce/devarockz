import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { supabase, supabaseAdmin } from './database'
import type { User, LoginRequest, SignupRequest, JwtPayload } from '@/types'

export class AuthService {
  private static instance: AuthService
  private jwtSecret: string

  private constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key'
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Generate JWT token
  generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    } as jwt.SignOptions)
  }

  // Verify JWT token
  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload
    } catch {
      return null
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  // Compare password
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  // Sign up user
  async signUp(userData: SignupRequest): Promise<{ user: User; token: string }> {
    const { email, password, full_name, role = 'bidder' } = userData

    try {
      // First, create user with Supabase Auth using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role
        }
      })

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create user account')
      }

      // Wait a bit for auth user to be fully created and trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500))

      // The trigger should have created the user profile, let's update it with our data
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          email: authData.user.email || email,
          full_name,
          role,
          is_verified: true,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)
        .select()
        .single()

      if (updateError || !updatedUser) {
        console.error('Profile update error:', updateError)
        // Clean up the auth user
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError)
        }
        throw new Error(`Failed to update user profile: ${updateError?.message}`)
      }

      // Generate token
      const token = this.generateToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      })

      return { user: updatedUser, token }
    } catch (error) {
      console.error('Signup error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to create user account')
    }
  }  // Sign in user
  async signIn(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    const { email, password } = credentials

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      throw new Error('Invalid email or password')
    }

    // Get user profile
    const { data: user, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !user) {
      throw new Error('User profile not found')
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated')
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return { user, token }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return null
    }

    return user
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error || !user) {
      throw new Error(error?.message || 'Failed to update profile')
    }

    return user
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CORS_ORIGIN}/reset-password`
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  // Change password
  async changePassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  // Deactivate user
  async deactivateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)

    if (error) {
      throw new Error(error.message)
    }
  }
}