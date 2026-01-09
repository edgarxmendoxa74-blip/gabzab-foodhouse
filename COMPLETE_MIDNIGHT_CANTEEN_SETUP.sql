-- ==========================================
-- THE MIDNIGHT CANTEEN - COMPLETE DATABASE SETUP
-- ==========================================
-- This script creates all tables and seeds official menu data.
-- RUN THIS FIRST in the Supabase SQL Editor.

-- 1. CLEANUP
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS variations CASCADE;
DROP TABLE IF EXISTS add_ons CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;

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
  address TEXT,
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
('Chicken Silog', 'Crispy fried chicken served with Plain Rice and Egg.', 129.00, 'Silog Series', '/chicken_silog.jpg'),
('Porkchop Silog', 'Crispy fried porkchop served with Plain Rice and Egg.', 129.00, 'Silog Series', '/porkchop_silog.png'),
('Sisig Silog', 'Our signature sisig served with Plain Rice and Egg.', 109.00, 'Silog Series', '/silog.jpg'),
('Bacon Silog', 'Crispy bacon strips served with Plain Rice and Egg.', 129.00, 'Silog Series', '/silog.jpg'),
('Tocino Silog', 'Sweet cured pork served with Plain Rice and Egg.', 109.00, 'Silog Series', '/silog.jpg'),
('Beef Tapa Silog', 'Savory beef tapa served with Plain Rice and Egg.', 129.00, 'Silog Series', '/silog.jpg'),
('Siomai Silog (4pc)', '4 pieces of fried siomai served with Plain Rice and Egg.', 109.00, 'Silog Series', '/silog.jpg'),

-- Special Combos
('Sisig Rice + Porkchop', 'Our signature Sisig Rice served with a golden crispy Porkchop and Egg.', 179.00, 'Silog Series', '/sisig_rice_porkchop_v2.jpg'),
('Sisig Rice + 5pc Patties', 'Our signature Sisig Rice served with 5 juicy burger patties and Egg.', 179.00, 'Silog Series', '/sisig_rice_patties_v2.jpg'),

-- Platters
('Spicy Sisig Platter', 'Our signature sizzling sisig, perfect for sharing. Available in sizes good for 2, 3, or 4 pax.', 150.00, 'Platters', '/sisig.jpg');

INSERT INTO menu_items (title, description, price, category, image) VALUES ('Buldak Ramen Series', 'Spicy Korean noodles. Choose from Orange Quatro Cheese or Pink Carbonara. Add-ons available.', 149.00, 'Noodles', '/buldak_menu.jpg');
INSERT INTO menu_items (title, description, price, category, image) VALUES ('Classic Milktea Series', 'Creamy milktea with free pearls. Available in various flavors like Wintermelon, Taro, and more.', 79.00, 'Classic Milktea Series', '/milktea_menu.jpg');
INSERT INTO menu_items (title, description, price, category, image) VALUES ('Fruit Tea Series', 'Refreshing fruit-infused tea with free Nata de Coco. Flavors: Mango, Green Apple, and more.', 75.00, 'Fruit Tea Series', '/milktea_menu.jpg');

