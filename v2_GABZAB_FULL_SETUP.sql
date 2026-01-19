-- v2_GABZAB_FULL_SETUP.sql
-- Run this script to fully set up the database for Gabzab Food House.
-- Includes: Schema, Admin Auth, and Seed Data.

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables (Idempotent)
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL DEFAULT 'Gabzab Food House',
    address TEXT DEFAULT 'Poblacion, El Nido, Palawan',
    contact TEXT DEFAULT '0939-594-7269',
    logo_url TEXT,
    banner_images JSONB DEFAULT '[]',
    open_time TIME DEFAULT '10:00',
    close_time TIME DEFAULT '21:00',
    manual_status TEXT DEFAULT 'auto',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    variations JSONB DEFAULT '[]',
    flavors JSONB DEFAULT '[]',
    addons JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_types (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    account_number TEXT,
    account_name TEXT,
    qr_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    customer_details JSONB NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'Pending'
);

-- NEW: Admin Users Table for simple Login
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Storing plain text for simplicity as requested (MVP)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seed Data (American Ribhouse Theme)

-- Categories
INSERT INTO categories (id, name, sort_order) VALUES
('ribs', 'Signature Ribs', 1),
('steaks', 'Steaks', 2),
('wings', 'Buffalo Wings', 3),
('sides', 'Sides & Extras', 4),
('drinks', 'Drinks', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Menu Items
INSERT INTO menu_items (category_id, name, description, price, image, sort_order) VALUES
('ribs', 'Classic HQ Backribs', 'Slow-cooked tender pork ribs with our signature BBQ sauce', 350.00, 'https://source.unsplash.com/800x600/?ribs', 1),
('ribs', 'Spicy Hickory Ribs', 'Smoked ribs with a spicy hickory glaze', 380.00, 'https://source.unsplash.com/800x600/?bbq-ribs', 2),
('steaks', 'T-Bone Steak', 'Grilled T-Bone steak served with gravy and veggies', 450.00, 'https://source.unsplash.com/800x600/?steak', 1),
('wings', 'Buffalo Wings (6pcs)', 'Classic spicy buffalo wings', 220.00, 'https://source.unsplash.com/800x600/?buffalo-wings', 1),
('sides', 'Mashed Potato', 'Creamy mashed potatoes with butter', 50.00, 'https://source.unsplash.com/800x600/?mashed-potato', 1)
ON CONFLICT (id) DO NOTHING; -- Avoid duplicates if re-run

-- Admin User
INSERT INTO admin_users (username, password) VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Store Settings Main
INSERT INTO store_settings (id, store_name, contact, open_time, close_time) 
SELECT uuid_generate_v4(), 'Gabzab Food House', '0939-594-7269', '10:00', '21:00'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- Update existing if meant to overrite
UPDATE store_settings SET 
    store_name = 'Gabzab Food House',
    contact = '0939-594-7269',
    open_time = '10:00',
    close_time = '21:00'
WHERE TRUE;

-- 4. Policies (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Admin Users" ON admin_users FOR SELECT USING (true); -- Allow checking login

-- Reload
NOTIFY pgrst, 'reload config';
