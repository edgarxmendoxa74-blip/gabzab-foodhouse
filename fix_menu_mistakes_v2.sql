-- Fix 1: Change Garlic Rice to Plain Rice in descriptions for all Silog items
UPDATE menu_items SET description = REPLACE(description, 'Garlic Rice', 'Plain Rice') WHERE description LIKE '%Garlic Rice%';

-- Fix 2: Remove Patties from the menu as requested (based on description containing Patties)
DELETE FROM menu_items WHERE description LIKE '%Patties%' OR description LIKE '%Pattie%';

-- Fix 3: Fix Chicken Silog image (identify by description containing 'Chicken Silog')
UPDATE menu_items SET image = '/silog.jpg' WHERE description LIKE '%Chicken Silog%';
