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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Sellers can view own profile" ON public.seller_profiles;
DROP POLICY IF EXISTS "Sellers can update own profile" ON public.seller_profiles;
DROP POLICY IF EXISTS "Service role can insert seller profiles" ON public.seller_profiles;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Service role can manage users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Sellers can view own profile" ON public.seller_profiles
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Sellers can update own profile" ON public.seller_profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage seller profiles" ON public.seller_profiles
    FOR ALL USING (auth.role() = 'service_role');