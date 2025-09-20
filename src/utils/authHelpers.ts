export interface AuthStatus {
  isAuthenticated: boolean
  hasToken: boolean
  authType: 'buyer' | 'seller' | 'supabase' | 'none'
  token: string | null
}

export function getAuthStatus(): AuthStatus {
  // Check for custom auth tokens first
  const buyerToken = localStorage.getItem('auth_token')
  const sellerToken = localStorage.getItem('seller_token')
  
  if (buyerToken) {
    return {
      isAuthenticated: true,
      hasToken: true,
      authType: 'buyer',
      token: buyerToken
    }
  }
  
  if (sellerToken) {
    return {
      isAuthenticated: true,
      hasToken: true,
      authType: 'seller', 
      token: sellerToken
    }
  }
  
  // TODO: Add Supabase token check if needed
  // const supabaseSession = await supabase.auth.getSession()
  // if (supabaseSession.data.session?.access_token) { ... }
  
  return {
    isAuthenticated: false,
    hasToken: false,
    authType: 'none',
    token: null
  }
}

export function requireAuth(action: string = 'perform this action'): boolean {
  const authStatus = getAuthStatus()
  
  if (!authStatus.isAuthenticated) {
    console.warn(`[Auth] Authentication required to ${action}`)
    return false
  }
  
  console.log(`[Auth] User authenticated as ${authStatus.authType} for: ${action}`)
  return true
}

export function getAuthHeaders(): Record<string, string> {
  const authStatus = getAuthStatus()
  
  if (authStatus.hasToken && authStatus.token) {
    return {
      'Authorization': `Bearer ${authStatus.token}`
    }
  }
  
  return {}
}

export function debugAuthState(): void {
  const authStatus = getAuthStatus()
  console.log('[Auth Debug]', {
    isAuthenticated: authStatus.isAuthenticated,
    authType: authStatus.authType,
    hasToken: authStatus.hasToken,
    tokenLength: authStatus.token?.length || 0,
    tokenPreview: authStatus.token ? authStatus.token.substring(0, 20) + '...' : 'none'
  })
}