-- ==========================================
-- UNIVERSAL WEBSITE SETUP TEMPLATE
-- ==========================================
-- Use this as a foundation for any future e-commerce or menu-based 
-- websites using Supabase/PostgreSQL.

-- 1. CLEANUP (Optional: Only use in development to reset)
-- DROP TABLE IF EXISTS order_items;
-- DROP TABLE IF EXISTS orders;
-- DROP TABLE IF EXISTS menu_items;
-- DROP TABLE IF EXISTS store_settings;

-- 2. CREATE EXTENSIONS (Useful for UUIDs and searching)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. HELPER FUNCTIONS
-- Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CREATE TABLES

-- Core Menu/Products Table
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    email TEXT,
    address TEXT,
    order_type TEXT NOT NULL DEFAULT 'delivery', -- e.g., 'delivery', 'pickup', 'dine-in'
    payment_method TEXT NOT NULL DEFAULT 'cod',
    items JSONB NOT NULL, -- Stores snapshot of cart items
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- e.g., 'pending', 'preparing', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store/Website Settings Table
CREATE TABLE store_settings (
    id TEXT PRIMARY KEY, -- e.g., 'website_name', 'phone_number', 'isOpen'
    value TEXT,
    label TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ATTACH UPDATED_AT TRIGGERS
CREATE TRIGGER update_menu_items_modtime BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. SECURITY (Row Level Security - RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- 6.1 Policies for Menu Items
CREATE POLICY "Public Read Access" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON menu_items FOR ALL USING (auth.role() = 'authenticated');

-- 6.2 Policies for Orders
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Select Orders" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Update Orders" ON orders FOR UPDATE USING (auth.role() = 'authenticated');

-- 6.3 Policies for Store Settings
CREATE POLICY "Public Read Settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Admin Update Settings" ON store_settings FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. INITIAL SEED DATA

-- Sample Settings
INSERT INTO store_settings (id, label, value) VALUES 
('site_name', 'Store Name', 'My Awesome Store'),
('currency', 'Currency Symbol', '₱'),
('contact_num', 'Official Phone', '09123456789'),
('shipping_fee', 'Standard Delivery Fee', '50');

-- Sample Menu Categories/Items
INSERT INTO menu_items (title, description, price, category, image_url, sort_order) VALUES
('Best Seller Wings', 'Our signature crispy wings.', 249.00, 'Wings', '/sample_image.jpg', 1),
('Classic Milk Tea', 'Creamy tea with pearls.', 79.00, 'Drinks', '/sample_image.jpg', 2);

-- 8. INDEXING (For performance)
CREATE INDEX idx_menu_category ON menu_items(category);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ==========================================
-- SETUP COMPLETE
-- ==========================================
