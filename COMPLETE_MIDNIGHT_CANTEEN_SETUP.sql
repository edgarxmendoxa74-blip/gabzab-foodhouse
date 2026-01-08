-- ==========================================
-- THE MIDNIGHT CANTEEN - COMPLETE DATABASE SETUP
-- ==========================================
-- This script creates all tables and seeds official menu data.
-- RUN THIS FIRST in the Supabase SQL Editor.

-- 1. CLEANUP (Optional: Remove if you want to keep existing data)
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS store_settings;
DROP TABLE IF EXISTS menu_items;

-- 2. CREATE TABLES
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

CREATE TABLE orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  order_type TEXT NOT NULL,
  table_number TEXT,
  payment_method TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  store_name TEXT DEFAULT 'The Midnight Canteen',
  logo_url TEXT,
  theme_colors JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE SECURITY
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON menu_items FOR SELECT USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Access" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Select Access" ON orders FOR SELECT USING (true);
CREATE POLICY "Admin Update Access" ON orders FOR UPDATE USING (true);

-- 4. SEED OFFICIAL MENU DATA
INSERT INTO menu_items (title, description, price, category, image) VALUES
-- Wings
('Signature Wings Series', 'Crispy, juicy wings with your choice of flavor (Original or Spicy Buffalo) and size (6pc, 8pc, 10pc).', 249.00, 'Wings Series', '/wings.jpg'),

-- Refreshers
('Signature Refreshers (Large 22oz)', 'Choose from our wild variety of fruit-infused refreshers. Buy 2 for ₱5 off!', 45.00, 'Refreshers', '/refreshers.jpg'),

-- Silog Series & Rice Meals
('Chicken Silog', 'Crispy fried chicken served with Garlic Rice and Egg.', 129.00, 'Silog Series', '/chicken_silog_v2.jpg'),
('Porkchop Silog', 'Crispy fried porkchop served with Garlic Rice and Egg.', 129.00, 'Silog Series', '/porkchop_silog.png'),
('Sisig Silog', 'Our signature sisig served with Garlic Rice and Egg.', 109.00, 'Silog Series', '/silog.jpg'),
('Bacon Silog', 'Crispy bacon strips served with Garlic Rice and Egg.', 129.00, 'Silog Series', '/silog.jpg'),
('Tocino Silog', 'Sweet cured pork served with Garlic Rice and Egg.', 109.00, 'Silog Series', '/silog.jpg'),
('Beef Tapa Silog', 'Savory beef tapa served with Garlic Rice and Egg.', 129.00, 'Silog Series', '/silog.jpg'),
('Siomai Silog (4pc)', '4 pieces of fried siomai served with Garlic Rice and Egg.', 109.00, 'Silog Series', '/silog.jpg'),
('4pc Patties Meal', '4 juicy burger patties served with Garlic Rice and Gravy.', 109.00, 'Silog Series', '/patties_meal_v2.jpg'),

-- Special Combos
('Sisig Rice + Porkchop', 'Our signature Sisig Rice served with a golden crispy Porkchop and Egg.', 179.00, 'Silog Series', '/sisig_rice_porkchop_v2.jpg'),
('Sisig Rice + 5pc Patties', 'Our signature Sisig Rice served with 5 juicy burger patties and Egg.', 179.00, 'Silog Series', '/sisig_rice_patties_v2.jpg'),

-- Platters
('Spicy Sisig Platter', 'Our signature sizzling sisig, perfect for sharing. Available in sizes good for 2, 3, or 4 pax.', 150.00, 'Platters', '/sisig.jpg');
