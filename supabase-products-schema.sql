-- Extended schema for ecommerce products support
-- This extends the existing auction-focused schema

-- Create additional types for ecommerce
CREATE TYPE product_type AS ENUM ('auction', 'fixed_price', 'both');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE cart_status AS ENUM ('active', 'saved', 'expired');

-- Create products table (combines auction items and regular products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2), -- Fixed price for regular products
    compare_at_price DECIMAL(10,2), -- Original price for sales
    cost_price DECIMAL(10,2), -- Cost for profit calculations
    sku TEXT UNIQUE,
    barcode TEXT,
    weight DECIMAL(8,3), -- in kg
    dimensions JSONB, -- {length, width, height}
    type product_type DEFAULT 'fixed_price',
    stock_quantity INTEGER DEFAULT 0,
    track_quantity BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    requires_shipping BOOLEAN DEFAULT true,
    is_taxable BOOLEAN DEFAULT true,
    tax_rate DECIMAL(5,4) DEFAULT 0, -- Tax rate as percentage (e.g., 0.0825 for 8.25%)
    images TEXT[] DEFAULT '{}',
    condition item_condition DEFAULT 'new',
    brand TEXT,
    model TEXT,
    tags TEXT[] DEFAULT '{}',
    features JSONB, -- Product features as key-value pairs
    specifications JSONB, -- Technical specifications
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    shipping_methods TEXT[] DEFAULT '{}',
    meta_title TEXT,
    meta_description TEXT,
    slug TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Auction-specific fields (only used when type is 'auction' or 'both')
    auction_id UUID REFERENCES auctions(id) ON DELETE SET NULL,
    starting_price DECIMAL(10,2),
    reserve_price DECIMAL(10,2),
    bid_increment DECIMAL(10,2),
    auction_start_time TIMESTAMP WITH TIME ZONE,
    auction_end_time TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_price CHECK (price IS NULL OR price >= 0),
    CONSTRAINT valid_stock CHECK (stock_quantity >= 0),
    CONSTRAINT valid_auction_fields CHECK (
        CASE 
            WHEN type = 'auction' THEN starting_price IS NOT NULL AND auction_start_time IS NOT NULL AND auction_end_time IS NOT NULL
            WHEN type = 'fixed_price' THEN price IS NOT NULL
            WHEN type = 'both' THEN price IS NOT NULL AND starting_price IS NOT NULL AND auction_start_time IS NOT NULL AND auction_end_time IS NOT NULL
            ELSE false
        END
    )
);

-- Create product variants table (for size, color, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    sku TEXT UNIQUE,
    barcode TEXT,
    weight DECIMAL(8,3),
    stock_quantity INTEGER DEFAULT 0,
    option1 TEXT, -- e.g., Size
    option2 TEXT, -- e.g., Color
    option3 TEXT, -- e.g., Material
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_variant_price CHECK (price IS NULL OR price >= 0),
    CONSTRAINT valid_variant_stock CHECK (stock_quantity >= 0)
);

-- Create shopping cart table
CREATE TABLE IF NOT EXISTS public.shopping_cart (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status cart_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create cart items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID REFERENCES shopping_cart(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL, -- Price at time of adding to cart
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_cart_price CHECK (price >= 0),
    UNIQUE(cart_id, product_id, variant_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    status order_status DEFAULT 'pending',
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Customer information
    customer_email TEXT,
    customer_phone TEXT,
    
    -- Billing address
    billing_address JSONB,
    
    -- Shipping address
    shipping_address JSONB,
    shipping_method TEXT,
    tracking_number TEXT,
    
    -- Payment information
    payment_status payment_status DEFAULT 'pending',
    payment_method TEXT,
    payment_gateway TEXT,
    payment_transaction_id TEXT,
    
    -- Fulfillment
    fulfillment_status shipping_status DEFAULT 'pending',
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_amounts CHECK (
        subtotal >= 0 AND 
        tax_amount >= 0 AND 
        shipping_cost >= 0 AND 
        discount_amount >= 0 AND 
        total_amount >= 0
    )
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sku TEXT,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL, -- Price at time of order
    total DECIMAL(10,2) NOT NULL, -- quantity * price
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_order_quantity CHECK (quantity > 0),
    CONSTRAINT valid_order_price CHECK (price >= 0),
    CONSTRAINT valid_order_total CHECK (total >= 0)
);

-- Create inventory tracking table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'sale', 'restock', 'adjustment', 'return'
    quantity_change INTEGER NOT NULL, -- positive for additions, negative for reductions
    quantity_after INTEGER NOT NULL,
    reference_id UUID, -- order_id, adjustment_id, etc.
    reference_type TEXT, -- 'order', 'adjustment', 'return'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create product reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
    UNIQUE(product_id, user_id, order_id)
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id, variant_id)
);

-- Create discounts/coupons table
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'percentage', 'fixed_amount', 'free_shipping'
    value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    customer_usage_limit INTEGER DEFAULT 1,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_discount_value CHECK (value >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id ON shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_status ON shopping_cart(status);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_id ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- DISABLE Row Level Security for new tables
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_cart DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts DISABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_cart_updated_at BEFORE UPDATE ON public.shopping_cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
BEGIN
    order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT, 10, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update product stock when order is confirmed
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Only update stock when order status changes to confirmed
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        FOR item IN 
            SELECT oi.product_id, oi.variant_id, oi.quantity 
            FROM order_items oi 
            WHERE oi.order_id = NEW.id
        LOOP
            -- Update product stock
            IF item.variant_id IS NOT NULL THEN
                UPDATE product_variants 
                SET stock_quantity = stock_quantity - item.quantity
                WHERE id = item.variant_id;
                
                -- Log inventory movement
                INSERT INTO inventory_movements (
                    variant_id, movement_type, quantity_change, 
                    quantity_after, reference_id, reference_type
                ) VALUES (
                    item.variant_id, 'sale', -item.quantity,
                    (SELECT stock_quantity FROM product_variants WHERE id = item.variant_id),
                    NEW.id, 'order'
                );
            ELSE
                UPDATE products 
                SET stock_quantity = stock_quantity - item.quantity
                WHERE id = item.product_id;
                
                -- Log inventory movement
                INSERT INTO inventory_movements (
                    product_id, movement_type, quantity_change, 
                    quantity_after, reference_id, reference_type
                ) VALUES (
                    item.product_id, 'sale', -item.quantity,
                    (SELECT stock_quantity FROM products WHERE id = item.product_id),
                    NEW.id, 'order'
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock on order confirmation
CREATE TRIGGER on_order_confirmed
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_order();

-- Function to automatically set order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set order number
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Function to ensure cart is active when items are added
CREATE OR REPLACE FUNCTION ensure_active_cart()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shopping_cart 
    SET status = 'active', updated_at = NOW(), expires_at = NOW() + INTERVAL '30 days'
    WHERE id = NEW.cart_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure cart is active
CREATE TRIGGER ensure_active_cart_trigger
    AFTER INSERT OR UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION ensure_active_cart();