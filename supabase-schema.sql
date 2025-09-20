-- DISABLE necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('bidder', 'seller', 'admin');
CREATE TYPE auction_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE item_condition AS ENUM ('new', 'used', 'refurbished');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE shipping_status AS ENUM ('pending', 'shipped', 'delivered');
CREATE TYPE notification_type AS ENUM ('bid_placed', 'outbid', 'auction_won', 'auction_ended', 'payment_required');
CREATE TYPE business_type AS ENUM ('individual', 'company', 'partnership');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'bidder',
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (id)
);

-- Create seller_profiles table
CREATE TABLE IF NOT EXISTS public.seller_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create auctions table
CREATE TABLE IF NOT EXISTS public.auctions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    starting_price DECIMAL(10,2) NOT NULL,
    reserve_price DECIMAL(10,2),
    current_bid DECIMAL(10,2) NOT NULL,
    bid_increment DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status auction_status DEFAULT 'draft',
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total_bids INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    condition item_condition DEFAULT 'used',
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    shipping_methods TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_bid_increment CHECK (bid_increment > 0),
    CONSTRAINT valid_starting_price CHECK (starting_price > 0),
    CONSTRAINT valid_current_bid CHECK (current_bid >= starting_price),
    CONSTRAINT valid_auction_times CHECK (end_time > start_time)
);

-- Create bids table
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
    bidder_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_auto_bid BOOLEAN DEFAULT false,
    max_auto_bid DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    CONSTRAINT valid_bid_amount CHECK (amount > 0)
);

-- Create watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, auction_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    shipping_status shipping_status DEFAULT 'pending',
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_seller_id ON auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_auctions_category_id ON auctions(category_id);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

-- DISABLE Row Level Security (RLS)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Functions and triggers
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON public.auctions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update auction current_bid and total_bids when new bid is placed
CREATE OR REPLACE FUNCTION update_auction_on_new_bid()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.auctions 
    SET 
        current_bid = NEW.amount,
        total_bids = total_bids + 1,
        updated_at = NOW()
    WHERE id = NEW.auction_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update auction when new bid is placed
CREATE TRIGGER on_new_bid
    AFTER INSERT ON public.bids
    FOR EACH ROW EXECUTE FUNCTION update_auction_on_new_bid();

-- Insert some sample categories
INSERT INTO public.categories (name, description) VALUES
    ('Electronics', 'Computers, phones, gadgets and electronic devices'),
    ('Fashion', 'Clothing, accessories, shoes and fashion items'),
    ('Home & Garden', 'Furniture, home decor, gardening supplies'),
    ('Sports & Recreation', 'Sports equipment, outdoor gear, fitness items'),
    ('Art & Collectibles', 'Artwork, antiques, collectible items'),
    ('Books & Media', 'Books, movies, music, games'),
    ('Automotive', 'Cars, motorcycles, parts and accessories'),
    ('Jewelry & Watches', 'Fine jewelry, watches, precious metals'),
    ('Health & Beauty', 'Health products, cosmetics, beauty items'),
    ('Toys & Hobbies', 'Toys, games, hobby supplies');