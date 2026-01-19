-- GABZAB FOOD HOUSE SEED DATA
-- Run this script to update your database content to match the "American Ribhouse" theme.

-- 1. Update Store Settings
UPDATE store_settings
SET 
    store_name = 'Gabzab Food House',
    contact = '0939-594-7269',
    open_time = '10:00',
    close_time = '21:00'
WHERE TRUE;

-- 2. Clear old Menu Items (Optional - remove comment to wipe old data)
-- DELETE FROM menu_items;
-- DELETE FROM categories;

-- 3. Insert/Update Categories
INSERT INTO categories (id, name, sort_order) VALUES
('solo-meal', 'Solo Meal', 1),
('a-la-carte', 'A La Carte', 2),
('add-ons', 'Add Ons', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- 4. Insert/Update Menu Items (Savory Menu)
INSERT INTO menu_items (category_id, name, description, price, image, sort_order) VALUES
-- Solo Meals
('solo-meal', 'Chicken Wings Solo', 'Solo Meal comes with a FREE Fries or Juice. Available in Honey Glazed or Fiery Buffalo.', 179.00, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800', 1),
('solo-meal', 'Pork Ribs Solo', 'Solo Meal comes with a FREE Fries or Juice. Tender fall-off-the-bone ribs.', 179.00, 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800', 2),
('solo-meal', 'Pork Belly Solo', 'Solo Meal comes with a FREE Fries or Juice. Juicy and bursting with flavor.', 189.00, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800', 3),
('solo-meal', 'Beef Shortplate Solo', 'Solo Meal comes with a FREE Fries or Juice. Premium beef shortplate.', 189.00, 'https://images.unsplash.com/photo-1558030006-450675393462?w=800', 4),

-- A La Carte
('a-la-carte', 'Chicken Wings (3-pieces)', 'A La Carte. Choice of Honey Glazed or Fiery Buffalo.', 259.00, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800', 5),
('a-la-carte', 'Chicken Wings (5-pieces)', 'A La Carte. Choice of Honey Glazed or Fiery Buffalo.', 439.00, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800', 6),
('a-la-carte', 'Pork Ribs (3-pieces)', 'A La Carte. Fall-off-the-bone goodness.', 399.00, 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800', 7),
('a-la-carte', 'Pork Ribs (5-pieces)', 'A La Carte. Fall-off-the-bone goodness.', 599.00, 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800', 8),
('a-la-carte', 'Pork Belly (3-pieces)', 'A La Carte. Juicy pork belly portions.', 469.00, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800', 9),
('a-la-carte', 'Pork Belly (5-pieces)', 'A La Carte. Juicy pork belly portions.', 719.00, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800', 10),
('a-la-carte', 'Beef Shortplate (3-pieces)', 'A La Carte. Tender beef shortplate.', 469.00, 'https://images.unsplash.com/photo-1558030006-450675393462?w=800', 11),
('a-la-carte', 'Beef Shortplate (5-pieces)', 'A La Carte. Tender beef shortplate.', 719.00, 'https://images.unsplash.com/photo-1558030006-450675393462?w=800', 12),
('a-la-carte', 'Chicken Bites (6-pieces)', 'Crispy chicken bites. Choice of sauce.', 130.00, 'https://images.unsplash.com/photo-1569058242252-623df46b5025?w=800', 13),
('a-la-carte', 'Chicken Bites (12-pieces)', 'Crispy chicken bites. Choice of sauce.', 249.00, 'https://images.unsplash.com/photo-1569058242252-623df46b5025?w=800', 14),
('a-la-carte', 'Chicken Bites & Fries (6-pieces)', 'Chicken bites served with crispy fries.', 169.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800', 15),
('a-la-carte', 'Chicken Bites & Fries (12-pieces)', 'Chicken bites served with crispy fries.', 329.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800', 16),

-- Add Ons
('add-ons', 'Extra Rice', '', 15.00, 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800', 17),
('add-ons', 'Java Rice', 'Turmeric seasoned rice.', 20.00, 'https://images.unsplash.com/photo-1512058560366-cd2427ff5e70?w=800', 18),
('add-ons', 'Fried Egg', '', 15.00, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800', 19),
('add-ons', 'Boiled Egg', '', 15.00, 'https://images.unsplash.com/photo-1534349735944-23000c2834c3?w=800', 20),
('add-ons', 'Solo Fries', '', 45.00, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800', 21),
('add-ons', 'Solo Siomai', '', 45.00, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800', 22),
('add-ons', 'Juice', 'Refreshing fruit juice.', 25.00, 'https://images.unsplash.com/photo-1544051031-673fbc6d44e1?w=800', 23);

-- 5. Set Order Types (Ensure Pickup/Dine-in are active)
UPDATE order_types SET is_active = true WHERE id IN ('pickup', 'delivery', 'dine-in');
