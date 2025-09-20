import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

// Client for general operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for operations that bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true })
    
    return !error
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}