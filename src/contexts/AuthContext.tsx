import { createContext, useEffect, useState } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: Error }>
  signIn: (email: string, password: string) => Promise<{ error?: Error }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: Error }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from our custom users table
  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('[Auth] Starting fetchUserProfile for user:', authUser.id)
      console.log('[Auth] Supabase client available:', !!supabase)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      console.log('[Auth] Profile fetch result:', {
        success: !!data,
        error: error?.message,
        userData: data ? 'present' : 'null'
      })

      if (error) {
        console.error('[Auth] Error fetching user profile:', error)
        return null
      }

      return data as User
    } catch (error) {
      console.error('[Auth] Exception in fetchUserProfile:', error)
      return null
    }
  }

  useEffect(() => {
    console.log('[Auth] useEffect - Setting up auth...')

    // Check for stored session first
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('auth_user')

    if (token && userData) {
      try {
        console.log('[Auth] Found stored session, restoring...')
        const storedUser = JSON.parse(userData)
        setUser(storedUser)
        setLoading(false)
      } catch (error) {
        console.error('[Auth] Error parsing stored user data:', error)
        // Clear invalid data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setLoading(false)
      }
    } else {
      // Try Supabase as fallback
      console.log('[Auth] No stored session, trying Supabase...')
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('[Auth] Supabase session result:', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id
        })

        setSession(session)
        if (session?.user) {
          console.log('[Auth] Supabase session has user, fetching profile...')
          fetchUserProfile(session.user).then((profile) => {
            console.log('[Auth] Profile fetched, setting user:', !!profile)
            setUser(profile)
          })
        }
        setLoading(false)
      }).catch((error) => {
        console.error('[Auth] Error getting Supabase session:', error)
        setLoading(false)
      })
    }

    // Still listen for Supabase changes for compatibility
    console.log('[Auth] Setting up auth state listener...')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] Supabase auth state change event:', _event)
      console.log('[Auth] New Supabase session state:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        userId: session?.user?.id
      })

      setSession(session)
      if (session?.user) {
        console.log('[Auth] Supabase auth state change - fetching user profile...')
        const userProfile = await fetchUserProfile(session.user)
        setUser(userProfile)
      } else {
        console.log('[Auth] Supabase auth state change - clearing user')
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      console.log('[Auth] Cleaning up auth subscription...')
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('[Auth] signUp called for:', email)
      console.log('[Auth] Using backend API signup...')

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })

      const result = await response.json()

      console.log('[Auth] Backend API signup response:', {
        status: response.status,
        success: result.success,
        error: result.error
      })

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Signup failed')
      }

      if (!result.success || !result.data?.user) {
        throw new Error('Invalid response from server')
      }

      console.log('[Auth] Backend API signup successful')

      // Set the user from backend response
      const backendUser = result.data.user
      setUser(backendUser)

      return { error: undefined }
    } catch (error) {
      console.error('[Auth] Backend signup error:', error)
      return { error: error as Error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] signIn called for:', email)
      console.log('[Auth] Using backend API auth...')

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      console.log('[Auth] Backend API response:', {
        status: response.status,
        success: result.success,
        error: result.error
      })

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Authentication failed')
      }

      if (!result.success || !result.data?.user) {
        throw new Error('Invalid response from server')
      }

      console.log('[Auth] Backend API auth successful')

      // Set the user from backend response
      const backendUser = result.data.user
      const token = result.data.token

      // Store session in localStorage for persistence
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(backendUser))

      console.log('[Auth] Setting user state:', backendUser)
      setUser(backendUser)
      console.log('[Auth] User state set successfully')

      return { error: undefined }
    } catch (error) {
      console.error('[Auth] Backend auth error:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      console.log('[Auth] Signing out...')
      setUser(null)
      setSession(null)
      // Clear localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('[Auth] Reset password called for:', email)
      console.log('[Auth] Using backend API for password reset...')

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Password reset failed')
      }

      console.log('[Auth] Password reset request sent successfully')
      return { error: undefined }
    } catch (error) {
      console.error('[Auth] Password reset error:', error)
      return { error: error as Error }
    }
  }

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}