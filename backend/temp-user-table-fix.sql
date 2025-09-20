-- Comprehensive fix for seller functionality
-- Run this in your Supabase SQL Editor

-- Create missing enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('bidder', 'seller', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE business_type AS ENUM ('individual', 'company', 'partnership');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop the existing users table foreign key constraint if it exists
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Check if users table exists and has the right structure
DO $$ 
BEGIN
    -- If users table doesn't have the right columns, recreate it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        -- Drop and recreate users table
        DROP TABLE IF EXISTS public.users CASCADE;
        
        CREATE TABLE public.users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            role user_role DEFAULT 'bidder',
            full_name TEXT NOT NULL,
            avatar_url TEXT,
            phone TEXT,
            address JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_verified BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true
        );
    END IF;
END $$;

-- Create or recreate seller_profiles table
DROP TABLE IF EXISTS public.seller_profiles CASCADE;

CREATE TABLE public.seller_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    business_name TEXT NOT NULL,
    business_type business_type NOT NULL DEFAULT 'individual',
    phone TEXT NOT NULL,
    business_address JSONB NOT NULL,
    tax_id TEXT,
    verification_status verification_status DEFAULT 'pending',
    verification_documents JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
