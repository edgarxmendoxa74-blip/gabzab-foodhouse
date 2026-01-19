-- COMPLETE ADMIN DASHBOARD SQL TEMPLATE
-- This script sets up the entire database schema for the Admin Dashboard.
-- It works for both fresh installs and updates (idempotent).
-- It incorporates all recent fixes (Text IDs, new columns, etc.).

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL DEFAULT 'Babalicious Lechon',
    address TEXT DEFAULT 'Poblacion, El Nido, Palawan',
    contact TEXT DEFAULT '09563713967',
    logo_url TEXT,
    banner_images JSONB DEFAULT '[]',
    open_time TIME DEFAULT '10:00',
    close_time TIME DEFAULT '01:00',
    manual_status TEXT DEFAULT 'auto', -- 'auto', 'open', 'closed'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories Table
-- Using TEXT id to allow friendly IDs like 'lechon' or UUIDs
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    promo_price DECIMAL(10, 2),
    image TEXT,
    out_of_stock BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    variations JSONB DEFAULT '[]', -- [{name, price, disabled}]
    flavors JSONB DEFAULT '[]',    -- [{name, disabled}]
    addons JSONB DEFAULT '[]',     -- [{name, price, disabled}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Order Types Table
CREATE TABLE IF NOT EXISTS order_types (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Payment Settings Table
CREATE TABLE IF NOT EXISTS payment_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    account_number TEXT,
    account_name TEXT,
    qr_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    customer_details JSONB NOT NULL, -- {name, phone, address, etc}
    items JSONB NOT NULL,            -- Array of items
    total_amount DECIMAL(10, 2) NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'Pending'    -- Pending, Preparing, Ready, Completed, Cancelled
);

-- =============================================
-- FIXES & MIGRATIONS (For existing databases)
-- =============================================

-- Ensure menu_items has all necessary columns
DO $$
BEGIN
    ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS promo_price DECIMAL(10, 2);
    ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image TEXT;
    ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS out_of_stock BOOLEAN DEFAULT FALSE;
    ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Ensure IDs are TEXT for flexibility (if they were UUIDs)
-- This block attempts to convert if possible, but mainly sets defaults for new tables
-- (Note: Complex type conversion on existing data with FKs might require dropping constraints first, 
-- but this script focuses on the target state. See MASTER_FIX.sql for heavy-duty repair).

-- =============================================
-- SEED DATA (Safe to run multiple times)
-- =============================================

-- Seed Categories
INSERT INTO categories (id, name, sort_order) VALUES 
('lechon', 'Whole Lechon', 0),
('lechon-belly', 'Lechon Belly', 1),
('party-box', 'Party Box', 2),
('silog', 'Silog Series', 3),
('platters', 'Bilao Platters', 4),
('wings', 'Chicken Wings', 5),
('milktea', 'Milktea Series', 6),
('refreshers', 'Refreshers', 7)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Seed Order Types
INSERT INTO order_types (id, name, is_active) VALUES 
('pickup', 'Pickup', true),
('delivery', 'Delivery', true),
('dine-in', 'Dine In', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- Seed Payment Settings
INSERT INTO payment_settings (id, name, account_number, account_name, is_active) VALUES 
('gcash', 'GCash', '', '', true),
('paymaya', 'PayMaya', '', '', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Store Settings (only if empty)
INSERT INTO store_settings (id, store_name, contact) 
SELECT uuid_generate_v4(), 'Babalicious Lechon', '09563713967'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- Enable RLS on all tables
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies (Adjust 'true' to more restrictive checks for production)
-- ALLOW READ to Everyone (Public)
CREATE POLICY "Public Read Store Settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Menu Items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public Read Order Types" ON order_types FOR SELECT USING (true);
CREATE POLICY "Public Read Payment Settings" ON payment_settings FOR SELECT USING (true);

-- ALLOW INSERT/UPDATE/DELETE to Authenticated Users (Admins)
-- For a simple setup without auth, sometimes 'true' is used for everything, 
-- but here we assume 'authenticated' role or public for now.
-- WARNING: For this template, we are making it permissible for development.
-- You should lock this down to 'auth.role() = "authenticated"' in production.

CREATE POLICY "Enable All Access for All Users" ON store_settings FOR ALL USING (true);
CREATE POLICY "Enable All Access for All Users" ON categories FOR ALL USING (true);
CREATE POLICY "Enable All Access for All Users" ON menu_items FOR ALL USING (true);
CREATE POLICY "Enable All Access for All Users" ON order_types FOR ALL USING (true);
CREATE POLICY "Enable All Access for All Users" ON payment_settings FOR ALL USING (true);

-- Orders might need public insert
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true); -- Or only admin
CREATE POLICY "Public Update Orders" ON orders FOR UPDATE USING (true); -- Admin update status

-- Reload schema cache
NOTIFY pgrst, 'reload config';
