-- Minimal fix: Just create missing enum types
-- Run this if you don't want to recreate tables

-- Create missing enum types
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

-- Remove problematic foreign key constraint
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Create seller_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.seller_profiles (
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