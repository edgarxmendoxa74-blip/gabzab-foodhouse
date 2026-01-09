-- Fix 1: Change Garlic Rice to Plain Rice in descriptions for all Silog items
UPDATE menu_items SET description = 'Crispy fried chicken served with Plain Rice and Egg.' WHERE title = 'Chicken Silog';
UPDATE menu_items SET description = 'Crispy fried porkchop served with Plain Rice and Egg.' WHERE title = 'Porkchop Silog';
UPDATE menu_items SET description = 'Our signature sisig served with Plain Rice and Egg.' WHERE title = 'Sisig Silog';
UPDATE menu_items SET description = 'Crispy bacon strips served with Plain Rice and Egg.' WHERE title = 'Bacon Silog';
UPDATE menu_items SET description = 'Sweet cured pork served with Plain Rice and Egg.' WHERE title = 'Tocino Silog';
UPDATE menu_items SET description = 'Savory beef tapa served with Plain Rice and Egg.' WHERE title = 'Beef Tapa Silog';
UPDATE menu_items SET description = '4 pieces of fried siomai served with Plain Rice and Egg.' WHERE title = 'Siomai Silog (4pc)';
UPDATE menu_items SET description = 'Our signature Sisig Rice served with a golden crispy Porkchop and Egg.' WHERE title = 'Sisig Rice + Porkchop';

-- Fix 2: Remove Patties from the menu as requested
DELETE FROM menu_items WHERE title LIKE '%Patties%' OR title LIKE '%Pattie%';

-- Fix 3: Fix Chicken Silog image
UPDATE menu_items SET image = '/silog.jpg' WHERE title = 'Chicken Silog';
