-- Seed official menu data for The Midnight Canteen
INSERT INTO menu_items (title, description, price, category, image) VALUES
('Signature Wings Series', 'Crispy, juicy wings with your choice of flavor (Original or Spicy Buffalo) and size.', 249.00, 'Wings Series', '/wings.jpg'),
('Silog Series (Classic)', 'Traditional Filipino breakfast meals served with Garlic Rice and Egg (Chicken, Sisig, Bacon, etc.).', 109.00, 'Silog Series', '/silog.jpg'),
('Refreshers (Large 22oz)', 'Stay cool with our signature fruit-infused refreshers.', 45.00, 'Refreshers', '/refreshers.jpg'),
('Spicy Sisig Platter', 'Our signature sizzling sisig, perfect for sharing (Available in multiple sizes).', 150.00, 'Platters', '/sisig.jpg');

-- Since we are moving from 'paintings' to 'menu_items', we should update Home.jsx to use this table.
