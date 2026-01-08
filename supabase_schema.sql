-- Create a table for menu items
CREATE TABLE menu_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_available BOOLEAN DEFAULT TRUE
);

-- Create a table for customer orders
CREATE TABLE orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, preparing, out-for-delivery, delivered, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a table for store settings (logo, branding, etc.) if needed later
CREATE TABLE store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  store_name TEXT DEFAULT 'The Midnight Canteen',
  logo_url TEXT,
  theme_colors JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) - Basic public read for items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON menu_items FOR SELECT USING (true);

-- Orders should be insertable by public, but readable by admin
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Access" ON orders FOR INSERT WITH CHECK (true);
-- Note: In a production environment, you would restrict SELECT access to authenticated admins.
CREATE POLICY "Admin Select Access" ON orders FOR SELECT USING (true);
CREATE POLICY "Admin Update Access" ON orders FOR UPDATE USING (true);
