-- Quick fix: Remove the foreign key constraint that's causing issues
-- Run this in your Supabase SQL Editor

-- First, check if the constraint exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass;

-- Drop the problematic foreign key constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Now the users table can accept any UUID as the primary key
-- without requiring it to exist in auth.users first