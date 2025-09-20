import { createContext, useEffect, useRef, useState, useCallback } from 'react'

// Module-level guard to reduce duplicate initialization side-effects when React StrictMode
// intentionally mounts components twice in development. We still allow state subscriptions
// to register each mount, but we can skip expensive one-time logs or network calls if desired.
let unifiedAuthInitializedOnce = false
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'
import { sellerAuthService, type SellerProfile } from '@/services/sellerAuthService'

interface SellerUser extends User {
  seller_profile: SellerProfile
}

interface UnifiedAuthContextType {
  // Supabase auth (for regular users)
  session: Session | null
  user: User | null
  
  // Seller auth (for sellers using custom JWT)
  sellerUser: SellerUser | null
  sellerToken: string | null
  
  // Common properties
  loading: boolean
  isAuthenticated: boolean
  currentUser: User | SellerUser | null
  userType: 'bidder' | 'seller' | null
  
  // Supabase auth methods
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: Error }>
  signIn: (email: string, password: string) => Promise<{ error?: Error }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: Error }>
  
  // Seller auth methods
  sellerSignIn: (email: string, password: string) => Promise<{ error?: Error }>
  sellerSignOut: () => Promise<void>
}

export const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined)

interface UnifiedAuthProviderProps {
  children: React.ReactNode
}

export function UnifiedAuthProvider({ children }: UnifiedAuthProviderProps) {
  // Supabase auth state
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  
  // Seller auth state
  const [sellerUser, setSellerUser] = useState<SellerUser | null>(null)
  const [sellerToken, setSellerToken] = useState<string | null>(null)
  
  // Common state
  const [loading, setLoading] = useState(true)

  // If we have a session but no user profile, create a temporary user from session data
  const sessionFallbackUser = session?.user && !user ? {
    id: session.user.id,
    email: session.user.email!,
    full_name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
    role: 'bidder' as const,
    created_at: session.user.created_at,
    updated_at: new Date().toISOString(),
    is_verified: false,
    is_active: true
  } : null

  const currentUser = sellerUser || user || sessionFallbackUser
  const userType: 'bidder' | 'seller' | null = sellerUser ? 'seller' : (user || sessionFallbackUser) ? ((user || sessionFallbackUser)!.role as 'bidder' | 'seller') : null

  // Computed properties
  const isAuthenticated = !!((session && (user || sessionFallbackUser)) || sellerUser)

  // Fetch user profile from our custom users table
  const fetchUserProfile = useCallback(async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('Fetching user profile for:', authUser.id)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.warn('Error fetching user profile:', error)
        // Fallback to creating a basic user object from session data
        const fallbackUser: User = {
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
          role: 'bidder', // Default role
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
          is_verified: false,
          is_active: true
        }
        console.log('Using fallback user data:', fallbackUser)
        return fallbackUser
      }

      console.log('User profile fetched successfully:', data)
      return data as User
    } catch (error) {
      console.error('Exception while fetching user profile:', error)
      // Fallback to creating a basic user object from session data
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
        role: 'bidder', // Default role
        created_at: authUser.created_at,
        updated_at: new Date().toISOString(),
        is_verified: false,
        is_active: true
      }
      console.log('Using fallback user data after exception:', fallbackUser)
      return fallbackUser
    }
  }, [])

  // Load seller auth from localStorage on mount
  const loadSellerAuth = useCallback(() => {
    try {
      const token = localStorage.getItem('seller_token')
      const userData = localStorage.getItem('seller_user')
      const profileData = localStorage.getItem('seller_profile')

      if (token && userData && profileData) {
        const user = JSON.parse(userData) as User
        const profile = JSON.parse(profileData) as SellerProfile

        setSellerToken(token)
        setSellerUser({
          ...user,
          seller_profile: profile
        })
      }
    } catch (error) {
      console.error('Error loading seller auth from localStorage:', error)
      // Clear invalid data
      localStorage.removeItem('seller_token')
      localStorage.removeItem('seller_user')
      localStorage.removeItem('seller_profile')
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let authCheckTimeout: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      try {
        if (!unifiedAuthInitializedOnce) {
          console.log('Initializing unified auth system...')
          unifiedAuthInitializedOnce = true
        }

        // Load seller auth from localStorage first
        loadSellerAuth()

        // Set a timeout to ensure loading is always set to false
        authCheckTimeout = setTimeout(() => {
          if (mounted) {
            console.log('Auth initialization safety timeout reached')
            setLoading(false)
          }
        }, 5000) // 5 second safety timeout

        // Get initial Supabase session
        const start = performance.now()
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!mounted) return

          console.log('[Auth] Initial Supabase session retrieved in', Math.round(performance.now() - start), 'ms =>', !!session)
          setSession(session)

          if (session?.user) {
            try {
              const userProfile = await fetchUserProfile(session.user)
              if (mounted && userProfile) setUser(userProfile)
            } catch (profileError) {
              console.warn('[Auth] Failed to fetch user profile (non-fatal):', profileError)
            }
          }
        } catch (sessionError) {
          console.warn('[Auth] getSession failed:', sessionError)
          if (mounted) {
            setSession(null)
            setUser(null)
          }
        }

      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        // Always set loading to false after initialization attempt
        if (mounted) {
          setTimeout(() => {
            if (mounted) {
              console.log('Auth initialization completed, setting loading to false')
              setLoading(false)
            }
          }, 1000) // Small delay to allow state updates
        }
      }
    }

    initializeAuth()

    // Listen for Supabase auth changes
    let subscription: { subscription: { unsubscribe: () => void } } | null = null
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (mounted) {
          console.log('Auth state changed:', _event, !!session)
          setSession(session)

          if (session?.user) {
            try {
              const userProfile = await fetchUserProfile(session.user)
              if (mounted && userProfile) {
                setUser(userProfile)
              }
            } catch (error) {
              console.error('Error fetching user profile on auth change:', error)
            }
          } else {
            setUser(null)
          }
        }
      })
      subscription = data
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
    }

    return () => {
      mounted = false
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout)
      }
      if (subscription) {
        try {
          subscription.subscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing from auth state changes:', error)
        }
      }
    }
  }, [loadSellerAuth, fetchUserProfile])

  // Helper function for retry logic
  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.warn(`Attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay * attempt))
        }
      }
    }
    
    throw lastError!
  }

  // Supabase auth methods
  // Prevent overlapping auth operations
  const authInFlightRef = useRef(false)

  const withInFlightGuard = async <T,>(label: string, fn: () => Promise<T>): Promise<T> => {
    if (authInFlightRef.current) {
      console.warn(`[Auth] Attempted to start ${label} while another auth operation is in flight`)
      throw new Error('Another authentication operation is in progress. Please wait.')
    }
    authInFlightRef.current = true
    try {
      return await fn()
    } finally {
      authInFlightRef.current = false
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Starting user signup process...')
      
      const start = performance.now()
      const result = await withInFlightGuard('signup', async () => {
        const op = async () => supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        return await retryOperation(op, 2)
      })
      const { error } = result

      console.log('Supabase signup response in', Math.round(performance.now() - start), 'ms', { error })
      
      if (error) {
        console.error('Supabase signup error:', error.message)
        return { error }
      }

      return { error: undefined }
    } catch (error) {
      console.error('Signup error:', error)
      
      if (error instanceof Error) {
        return { error }
      }
      
      return { error: new Error('An unexpected error occurred during signup') }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting regular user signin process...')

      // Clear any existing seller auth when signing in as regular user
      await sellerSignOut()

      console.log('Calling Supabase auth...')

      const start = performance.now()
      const result = await withInFlightGuard('signin', async () => {
        const op = async () => supabase.auth.signInWithPassword({ email, password })
        return await retryOperation(op, 2)
      })
      const { error, data } = result

      console.log('Supabase auth response in', Math.round(performance.now() - start), 'ms', { error })

      if (error) {
        console.error('Supabase auth error:', error.message)
        return { error }
      }

      // If successful, ensure we fetch the user profile immediately
      if (data?.user) {
        try {
          const userProfile = await fetchUserProfile(data.user)
          setUser(userProfile)
        } catch (profileError) {
          console.warn('Failed to fetch user profile immediately after signin:', profileError)
        }
      }

      return { error: undefined }
    } catch (error) {
      console.error('Regular signin error:', error)

      if (error instanceof Error) {
        return { error }
      }

      return { error: new Error('An unexpected error occurred during signin') }
    }
  }

  const signOut = async () => {
    try {
      // Sign out from both systems
      await Promise.all([
        supabase.auth.signOut(),
        sellerSignOut()
      ])
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      return { error: error || undefined }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Seller auth methods
  const sellerSignIn = async (email: string, password: string) => {
    try {
      console.log('Starting seller signin process...')
      
      // Clear any existing Supabase auth when signing in as seller
      await supabase.auth.signOut()
      
      console.log('Calling seller auth service...')
      
      const start = performance.now()
      const response = await withInFlightGuard('seller-signin', async () => {
        const op = async () => sellerAuthService.sellerSignin({ email, password })
        return await retryOperation(op, 2, 2000)
      })
      console.log('Seller auth response:', response)
      console.log('Seller auth total time', Math.round(performance.now() - start), 'ms')

      if (response.success && response.data) {
        const { user, seller_profile, token } = response.data

        console.log('Storing seller auth data...')
        // Store in localStorage
        localStorage.setItem('seller_token', token)
        localStorage.setItem('seller_user', JSON.stringify(user))
        localStorage.setItem('seller_profile', JSON.stringify(seller_profile))

        // Update state
        setSellerToken(token)
        setSellerUser({
          ...user,
          seller_profile
        })

        console.log('Seller signin successful')
        return { error: undefined }
      } else {
        console.error('Seller signin failed:', response.error)
        return { error: new Error(response.error || 'Seller login failed') }
      }
    } catch (error) {
      console.error('Seller signin error:', error)
      
      // If seller auth fails, show a more helpful error
      if (error instanceof Error) {
        return { error }
      }
      return { error: new Error('Unknown seller signin error') }
    }
  }

  const sellerSignOut = async () => {
    // Clear localStorage
    localStorage.removeItem('seller_token')
    localStorage.removeItem('seller_user')
    localStorage.removeItem('seller_profile')

    // Clear state
    setSellerToken(null)
    setSellerUser(null)
  }

  const value = {
    // Supabase auth
    session,
    user,
    
    // Seller auth
    sellerUser,
    sellerToken,
    
    // Common
    loading,
    isAuthenticated,
    currentUser,
    userType,
    
    // Methods
    signUp,
    signIn,
    signOut,
    resetPassword,
    sellerSignIn,
    sellerSignOut,
  }

  return <UnifiedAuthContext.Provider value={value}>{children}</UnifiedAuthContext.Provider>
}