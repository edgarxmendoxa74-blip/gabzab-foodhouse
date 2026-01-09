-- ==========================================
-- COMPLETE MIGRATED DATABASE SETUP
-- ==========================================

-- 1. CLEANUP (Optional: Remove if you want to start fresh)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS add_ons CASCADE;
DROP TABLE IF EXISTS variations CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 2. CREATE SCHEMA

-- Create categories table
CREATE TABLE categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '☕',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  base_price decimal(10,2) NOT NULL,
  category text NOT NULL REFERENCES categories(id),
  popular boolean DEFAULT false,
  available boolean DEFAULT true,
  image_url text,
  track_inventory boolean NOT NULL DEFAULT false,
  stock_quantity integer,
  low_stock_threshold integer NOT NULL DEFAULT 0,
  discount_price decimal(10,2),
  discount_start_date timestamptz,
  discount_end_date timestamptz,
  discount_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT menu_items_stock_quantity_non_negative CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  CONSTRAINT menu_items_low_stock_threshold_non_negative CHECK (low_stock_threshold >= 0)
);

-- Create variations table
CREATE TABLE variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create add_ons table
CREATE TABLE add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create payment_methods table
CREATE TABLE payment_methods (
  id text PRIMARY KEY,
  name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  qr_code_url text NOT NULL,
  active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create site_settings table
CREATE TABLE site_settings (
  id text PRIMARY KEY,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('dine-in','pickup','delivery')),
  address text,
  pickup_time text,
  party_size integer,
  dine_in_time timestamptz,
  payment_method text NOT NULL,
  reference_number text,
  notes text,
  total numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  ip_address text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  name text NOT NULL,
  variation jsonb,
  add_ons jsonb,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. SECURITY & TRIGGERS

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Policies
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT TO public USING (active = true);

DROP POLICY IF EXISTS "Anyone can read menu items" ON menu_items;
CREATE POLICY "Anyone can read menu items" ON menu_items FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anyone can read variations" ON variations;
CREATE POLICY "Anyone can read variations" ON variations FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anyone can read add-ons" ON add_ons;
CREATE POLICY "Anyone can read add-ons" ON add_ons FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anyone can read active payment methods" ON payment_methods;
CREATE POLICY "Anyone can read active payment methods" ON payment_methods FOR SELECT TO public USING (active = true);

DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
CREATE POLICY "Anyone can read site settings" ON site_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert orders" ON orders;
CREATE POLICY "Public can insert orders" ON orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can select orders" ON orders;
CREATE POLICY "Public can select orders" ON orders FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert order items" ON order_items;
CREATE POLICY "Public can insert order items" ON order_items FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can select order items" ON order_items;
CREATE POLICY "Public can select order items" ON order_items FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage categories" ON categories;
CREATE POLICY "Admin manage categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage menu items" ON menu_items;
CREATE POLICY "Admin manage menu items" ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage variations" ON variations;
CREATE POLICY "Admin manage variations" ON variations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage add-ons" ON add_ons;
CREATE POLICY "Admin manage add-ons" ON add_ons FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage payment methods" ON payment_methods;
CREATE POLICY "Admin manage payment methods" ON payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage site settings" ON site_settings;
CREATE POLICY "Admin manage site settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Spam Protection
CREATE OR REPLACE FUNCTION set_order_ip_from_headers()
RETURNS trigger AS $$
DECLARE
  headers jsonb;
  fwd text;
  chosen text;
BEGIN
  IF NEW.ip_address IS NOT NULL AND length(trim(NEW.ip_address)) > 0 THEN
    RETURN NEW;
  END IF;
  BEGIN
    headers := current_setting('request.headers', true)::jsonb;
  EXCEPTION WHEN others THEN
    headers := '{}'::jsonb;
  END;
  fwd := COALESCE(headers->>'x-forwarded-for', headers->>'x-real-ip');
  IF fwd IS NOT NULL AND length(trim(fwd)) > 0 THEN
    chosen := split_part(fwd, ',', 1);
  END IF;
  IF chosen IS NOT NULL AND length(trim(chosen)) > 0 THEN
    NEW.ip_address := trim(chosen);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION prevent_spam_orders_per_ip()
RETURNS trigger AS $$
DECLARE
  recent_count int;
BEGIN
  IF NEW.ip_address IS NULL OR length(trim(NEW.ip_address)) = 0 THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO recent_count FROM orders WHERE ip_address = NEW.ip_address AND created_at >= (now() - interval '60 seconds');
  IF recent_count > 0 THEN
    RAISE EXCEPTION 'Rate limit: Please wait 60 seconds before placing another order.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_order_ip_from_headers BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION set_order_ip_from_headers();
CREATE TRIGGER trg_prevent_spam_orders_per_ip BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION prevent_spam_orders_per_ip();

-- Inventory Sync
CREATE OR REPLACE FUNCTION sync_menu_item_availability()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(NEW.track_inventory, false) THEN
    NEW.stock_quantity := GREATEST(COALESCE(NEW.stock_quantity, 0), 0);
    NEW.low_stock_threshold := GREATEST(COALESCE(NEW.low_stock_threshold, 0), 0);
    IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
      NEW.available := false;
    ELSE
      NEW.available := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_menu_item_availability BEFORE INSERT OR UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION sync_menu_item_availability();

-- Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read menu-images" ON storage.objects;
CREATE POLICY "Public read menu-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Public upload menu-images" ON storage.objects;
CREATE POLICY "Public upload menu-images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'menu-images');

-- 4. SEED DATA (MIGRATED MENUS)

-- Insert Categories
INSERT INTO categories (id, name, icon, sort_order) VALUES
  ('wings-series', 'Wings Series', '🍗', 1),
  ('refreshers', 'Refreshers', '🥤', 2),
  ('silog-series', 'Silog Series', '🍛', 3),
  ('platters', 'Platters', '🍽️', 4),
  ('noodles', 'Noodles', '🍜', 5),
  ('classic-milktea', 'Classic Milktea', '🧋', 6),
  ('fruit-tea', 'Fruit Tea', '🍹', 7)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- Insert Menu Items (using DO block for linked variations)
DO $$
DECLARE
  v_wings_id uuid := '00000000-0000-0000-0000-000000000001';
  v_refreshers_id uuid := '00000000-0000-0000-0000-000000000002';
  v_chicken_silog_id uuid := '00000000-0000-0000-0000-000000000003';
  v_porkchop_silog_id uuid := '00000000-0000-0000-0000-000000000004';
  v_sisig_silog_id uuid := '00000000-0000-0000-0000-000000000005';
  v_bacon_silog_id uuid := '00000000-0000-0000-0000-000000000006';
  v_tocino_silog_id uuid := '00000000-0000-0000-0000-000000000007';
  v_beef_tapa_id uuid := '00000000-0000-0000-0000-000000000008';
  v_siomai_silog_id uuid := '00000000-0000-0000-0000-000000000009';
  v_sisig_porkchop_id uuid := '00000000-0000-0000-0000-000000000010';
  v_sisig_patties_id uuid := '00000000-0000-0000-0000-000000000011';
  v_sisig_platter_id uuid := '00000000-0000-0000-0000-000000000012';
  v_buldak_id uuid := '00000000-0000-0000-0000-000000000013';
  v_milktea_id uuid := '00000000-0000-0000-0000-000000000014';
  v_fruit_tea_id uuid := '00000000-0000-0000-0000-000000000015';
BEGIN
  -- Insert Menu Items
  INSERT INTO menu_items (id, name, description, base_price, category, popular, image_url) VALUES
  (v_wings_id, 'Signature Wings Series', 'Crispy, juicy wings with your choice of flavor (Original or Spicy Buffalo) and size (6pc, 8pc, 10pc).', 249.00, 'wings-series', true, '/wings.jpg'),
  (v_refreshers_id, 'Signature Refreshers', 'Choose from our wild variety of fruit-infused refreshers. Large 22oz.', 45.00, 'refreshers', true, '/refreshers.jpg'),
  (v_chicken_silog_id, 'Chicken Silog', 'Crispy fried chicken served with Plain Rice and Egg.', 129.00, 'silog-series', false, '/chicken_silog.jpg'),
  (v_porkchop_silog_id, 'Porkchop Silog', 'Crispy fried porkchop served with Plain Rice and Egg.', 129.00, 'silog-series', false, '/porkchop_silog.png'),
  (v_sisig_silog_id, 'Sisig Silog', 'Our signature sisig served with Plain Rice and Egg.', 109.00, 'silog-series', false, '/silog.jpg'),
  (v_bacon_silog_id, 'Bacon Silog', 'Crispy bacon strips served with Plain Rice and Egg.', 129.00, 'silog-series', false, '/silog.jpg'),
  (v_tocino_silog_id, 'Tocino Silog', 'Sweet cured pork served with Plain Rice and Egg.', 109.00, 'silog-series', false, '/silog.jpg'),
  (v_beef_tapa_id, 'Beef Tapa Silog', 'Savory beef tapa served with Plain Rice and Egg.', 129.00, 'silog-series', false, '/silog.jpg'),
  (v_siomai_silog_id, 'Siomai Silog (4pc)', '4 pieces of fried siomai served with Plain Rice and Egg.', 109.00, 'silog-series', false, '/silog.jpg'),
  (v_sisig_porkchop_id, 'Sisig Rice + Porkchop', 'Our signature Sisig Rice served with a golden crispy Porkchop and Egg.', 179.00, 'silog-series', true, '/sisig_rice_porkchop_v2.jpg'),
  (v_sisig_patties_id, 'Sisig Rice + 5pc Patties', 'Our signature Sisig Rice served with 5 juicy burger patties and Egg.', 179.00, 'silog-series', true, '/sisig_rice_patties_v2.jpg'),
  (v_sisig_platter_id, 'Spicy Sisig Platter', 'Our signature sizzling sisig, perfect for sharing. Available in sizes good for 2, 3, or 4 pax.', 150.00, 'platters', true, '/sisig.jpg'),
  (v_buldak_id, 'Buldak Ramen Series', 'Spicy Korean noodles. Choose from Orange Quatro Cheese or Pink Carbonara. Add-ons available.', 149.00, 'noodles', false, '/buldak_menu.jpg'),
  (v_milktea_id, 'Classic Milktea Series', 'Creamy milktea with free pearls. Available in various flavors like Wintermelon, Taro, and more.', 79.00, 'classic-milktea', true, '/milktea_menu.jpg'),
  (v_fruit_tea_id, 'Fruit Tea Series', 'Refreshing fruit-infused tea with free Nata de Coco. Flavors: Mango, Green Apple, and more.', 75.00, 'fruit-tea', false, '/milktea_menu.jpg');

  -- Insert Variations (Sizes and Flavors)
  -- Wings
  INSERT INTO variations (menu_item_id, name, price) VALUES
  (v_wings_id, '6pc', 249), (v_wings_id, '8pc', 299), (v_wings_id, '10pc', 349),
  (v_wings_id, 'Original Flavor', 0), (v_wings_id, 'Spicy Buffalo Flavor', 0);
  
  -- Refreshers
  INSERT INTO variations (menu_item_id, name, price) VALUES
  (v_refreshers_id, 'Blue Lemonade', 0), (v_refreshers_id, 'Cucumber Lemonade', 0),
  (v_refreshers_id, 'Strawberry Red Tea', 0), (v_refreshers_id, 'Orange Refresher', 0),
  (v_refreshers_id, 'Pineapple Refresher', 0), (v_refreshers_id, 'Citrus Dew', 0),
  (v_refreshers_id, 'Blueberry Refresher', 0), (v_refreshers_id, '4 Seasons', 0), (v_refreshers_id, 'Pine-O', 0);

  -- Platters
  INSERT INTO variations (menu_item_id, name, price) VALUES
  (v_sisig_platter_id, 'Good for 2', 150), (v_sisig_platter_id, 'Good for 3', 199), (v_sisig_platter_id, 'Good for 4', 249);

  -- Buldak
  INSERT INTO variations (menu_item_id, name, price) VALUES
  (v_buldak_id, 'Orange Buldak Quatro Cheese', 0), (v_buldak_id, 'Pink Buldak Carbonara', 0);

  -- Milktea
  INSERT INTO variations (menu_item_id, name, price) VALUES
  (v_milktea_id, 'Medium', 79), (v_milktea_id, 'Large', 89),
  (v_milktea_id, 'Cookies Overload', 0), (v_milktea_id, 'Dark Chocolate', 0), (v_milktea_id, 'Red Velvet', 0),
  (v_milktea_id, 'Cheesecake', 0), (v_milktea_id, 'Wintermelon', 0), (v_milktea_id, 'Taro', 0),
  (v_milktea_id, 'Matcha', 0), (v_milktea_id, 'Okinawa', 0), (v_milktea_id, 'Candy Rabbit', 0);

  -- Fruit Tea
  INSERT INTO variations (menu_item_id, name, price) VALUES
  (v_fruit_tea_id, 'Medium', 75), (v_fruit_tea_id, 'Large', 85),
  (v_fruit_tea_id, 'Mango', 0), (v_fruit_tea_id, 'Green Apple', 0), (v_fruit_tea_id, 'Blueberry', 0), (v_fruit_tea_id, 'Lychee', 0);

  -- Insert Add-ons
  -- Buldak Add-ons
  INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
  (v_buldak_id, 'Spam', 10, 'Toppings'), (v_buldak_id, 'Egg', 15, 'Toppings'),
  (v_buldak_id, 'Korean Fishcake', 15, 'Toppings'), (v_buldak_id, 'Nori Seaweed', 20, 'Toppings'),
  (v_buldak_id, 'Melted Cheese', 30, 'Toppings');

  -- Milktea Add-ons
  INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
  (v_milktea_id, 'Extra Pearl', 10, 'Toppings'), (v_milktea_id, 'Crushed Oreo', 10, 'Toppings'),
  (v_milktea_id, 'Nata de Coco', 10, 'Toppings'), (v_milktea_id, 'Coffee Jelly', 15, 'Toppings'),
  (v_milktea_id, 'Cheesecake Wall', 20, 'Special');

  -- Fruit Tea Add-ons
  INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
  (v_fruit_tea_id, 'Extra Nata', 10, 'Toppings'), (v_fruit_tea_id, 'Black Pearl', 10, 'Toppings'),
  (v_fruit_tea_id, 'Coffee Jelly', 15, 'Toppings');
END $$;

-- 5. PAYMENT METHODS & SITE SETTINGS

INSERT INTO payment_methods (id, name, account_number, account_name, qr_code_url, sort_order, active) VALUES
  ('cod', 'Cash on Delivery', 'N/A', 'N/A', '', 1, true),
  ('gcash', 'GCash', '0936 908 7295', 'The Midnight Canteen', '/gcash_qr.jpg', 2, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO site_settings (id, value, type, description) VALUES
  ('site_name', 'The Midnight Canteen', 'text', 'The name of the cafe/restaurant'),
  ('site_logo', '/assets/logo_brand.jpg', 'image', 'The logo image URL for the site'),
  ('site_description', 'Welcome to The Midnight Canteen - Your perfect coffee destination', 'text', 'Short description of the cafe'),
  ('currency', '₱', 'text', 'Currency symbol for prices'),
  ('currency_code', 'PHP', 'text', 'Currency code for payments'),
  ('messenger_id', '100064311721918', 'text', 'Facebook Messenger ID')
ON CONFLICT (id) DO NOTHING;
