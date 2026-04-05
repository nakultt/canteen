-- Canteen Seed Data
-- Production-ready seed with bcrypt-hashed passwords

-- =====================
-- CLEAR EXISTING DATA
-- =====================

TRUNCATE order_items, orders, cart_items, carts, menu_items, menus, food_items, users, companies RESTART IDENTITY CASCADE;

-- =====================
-- COMPANIES
-- =====================

INSERT INTO companies (name, address) VALUES
('Tech Campus Canteen', '123 Innovation Drive, Tech Park'),
('Hotel Grand Kitchen', '456 Hospitality Avenue, Downtown');

-- =====================
-- USERS (passwords are bcrypt-hashed)
-- =====================

-- DEV user (global admin, no company)
-- Password: devpass123
INSERT INTO users (email, name, password, role, company_id) VALUES
('dev@canteen.com', 'Dev Admin', '$2b$12$ruMSTvs5DFhtM/jGoNWdC.vizgu0KoRLbZfAY8jD2AHl3Sv9aahH2', 'DEV', NULL);

-- ADMIN users (per company)
-- Password: admin123
INSERT INTO users (email, name, password, role, company_id) VALUES
('admin@techcampus.com', 'Tech Campus Admin', '$2b$12$2mHeq.GSt8X.1OC0uMl2mO.VYMKPqpfXoldbvCUe.fVjpiWBD8bYa', 'ADMIN', 1),
('admin@hotelgrand.com', 'Hotel Grand Admin', '$2b$12$2mHeq.GSt8X.1OC0uMl2mO.VYMKPqpfXoldbvCUe.fVjpiWBD8bYa', 'ADMIN', 2);

-- Regular users
-- Password: password123
INSERT INTO users (email, name, password, role, company_id) VALUES
('nakul@example.com', 'Nakul', '$2b$12$NtJt5sAQt99/l1L3h4zUdOyJudOc4SPyW8Pjw.vEvNYa4EL92jja6', 'USER', 1),
('jane@example.com', 'Jane Smith', '$2b$12$NtJt5sAQt99/l1L3h4zUdOyJudOc4SPyW8Pjw.vEvNYa4EL92jja6', 'USER', 1),
('john@example.com', 'John Doe', '$2b$12$NtJt5sAQt99/l1L3h4zUdOyJudOc4SPyW8Pjw.vEvNYa4EL92jja6', 'USER', 2);

-- =====================
-- FOOD ITEMS (Tech Campus - Company 1)
-- =====================

INSERT INTO food_items (company_id, name, description, price, image_url, is_available) VALUES
(1, 'Chicken Biryani', 'Aromatic basmati rice with tender chicken pieces', 120.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', true),
(1, 'Veg Thali', 'Complete meal with dal, sabji, roti, rice & sweet', 80.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', true),
(1, 'Paneer Tikka', 'Grilled cottage cheese with spices', 100.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', true),
(1, 'Veg Fried Rice', 'Indo-Chinese style fried rice with vegetables', 90.00, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400', true),
(1, 'Masala Dosa', 'Crispy dosa with spiced potato filling', 60.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', true),
(1, 'Idli Sambar', 'Steamed rice cakes with lentil curry', 40.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', true),
(1, 'Grilled Sandwich', 'Toasted sandwich with vegetables and cheese', 50.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', true),
(1, 'Coffee', 'Fresh brewed coffee', 30.00, 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400', true),
(1, 'Masala Chai', 'Indian spiced tea with milk', 25.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400', true),
(1, 'Aloo Paratha', 'Stuffed flatbread with spiced potatoes', 45.00, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400', true),
(1, 'Samosa (2 pcs)', 'Crispy fried pastry with spiced potato filling', 30.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true),
(1, 'Veg Pakora', 'Mixed vegetable fritters', 40.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', true);

-- =====================
-- FOOD ITEMS (Hotel Grand - Company 2)
-- =====================

INSERT INTO food_items (company_id, name, description, price, image_url, is_available) VALUES
(2, 'Continental Breakfast', 'Eggs, toast, bacon, and juice', 150.00, 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400', true),
(2, 'Club Sandwich', 'Triple-decker sandwich with chicken', 120.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', true),
(2, 'Pasta Alfredo', 'Creamy pasta with parmesan', 140.00, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400', true);

-- =====================
-- MENUS (Tech Campus - 7 days)
-- =====================

-- Monday to Sunday - Breakfast, Lunch, Snacks, Dinner
DO $$
DECLARE
    days TEXT[] := ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    d TEXT;
    breakfast_id INTEGER;
    lunch_id INTEGER;
    snacks_id INTEGER;
    dinner_id INTEGER;
BEGIN
    FOREACH d IN ARRAY days LOOP
        -- Breakfast
        INSERT INTO menus (company_id, day_of_week, meal_type, start_time, end_time) 
        VALUES (1, d, 'Breakfast', '07:00', '10:00') RETURNING id INTO breakfast_id;
        
        INSERT INTO menu_items (menu_id, food_item_id) VALUES
            (breakfast_id, 5), -- Masala Dosa
            (breakfast_id, 6), -- Idli Sambar
            (breakfast_id, 10), -- Aloo Paratha
            (breakfast_id, 7), -- Grilled Sandwich
            (breakfast_id, 8), -- Coffee
            (breakfast_id, 9); -- Masala Chai
        
        -- Lunch
        INSERT INTO menus (company_id, day_of_week, meal_type, start_time, end_time) 
        VALUES (1, d, 'Lunch', '12:00', '15:00') RETURNING id INTO lunch_id;
        
        INSERT INTO menu_items (menu_id, food_item_id) VALUES
            (lunch_id, 1), -- Chicken Biryani
            (lunch_id, 2), -- Veg Thali
            (lunch_id, 3), -- Paneer Tikka
            (lunch_id, 4); -- Veg Fried Rice
        
        -- Snacks
        INSERT INTO menus (company_id, day_of_week, meal_type, start_time, end_time) 
        VALUES (1, d, 'Snacks', '16:00', '18:00') RETURNING id INTO snacks_id;
        
        INSERT INTO menu_items (menu_id, food_item_id) VALUES
            (snacks_id, 11), -- Samosa
            (snacks_id, 12), -- Veg Pakora
            (snacks_id, 8), -- Coffee
            (snacks_id, 9); -- Masala Chai
        
        -- Dinner
        INSERT INTO menus (company_id, day_of_week, meal_type, start_time, end_time) 
        VALUES (1, d, 'Dinner', '19:00', '22:00') RETURNING id INTO dinner_id;
        
        INSERT INTO menu_items (menu_id, food_item_id) VALUES
            (dinner_id, 1), -- Chicken Biryani
            (dinner_id, 2), -- Veg Thali
            (dinner_id, 4); -- Veg Fried Rice
    END LOOP;
END $$;

-- =====================
-- SAMPLE CART
-- =====================

INSERT INTO carts (user_id) VALUES (4); -- Nakul's cart

INSERT INTO cart_items (cart_id, food_item_id, quantity) VALUES
(1, 1, 2), -- 2x Chicken Biryani
(1, 8, 1); -- 1x Coffee

-- =====================
-- SAMPLE ORDER
-- =====================

INSERT INTO orders (user_id, total_amount, status) VALUES
(4, 240.00, 'COMPLETED');

INSERT INTO order_items (order_id, food_item_id, quantity, price) VALUES
(1, 1, 2, 120.00); -- 2x Chicken Biryani

-- =====================
-- SUMMARY
-- =====================

DO $$
BEGIN
    RAISE NOTICE 'Seed completed!';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - 2 Companies';
    RAISE NOTICE '  - 6 Users (1 DEV, 2 ADMIN, 3 USER)';
    RAISE NOTICE '  - 15 Food Items';
    RAISE NOTICE '  - 28 Menus (4 meals x 7 days)';
    RAISE NOTICE '  - 1 Sample Cart';
    RAISE NOTICE '  - 1 Sample Order';
    RAISE NOTICE '';
    RAISE NOTICE 'All passwords are bcrypt-hashed. See .env.example for setup.';
END $$;
