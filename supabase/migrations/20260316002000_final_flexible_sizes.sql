
-- Final SQL Migration for Admin-Defined Product Sizes
-- This script adds the necessary columns to allow admins to define any size (e.g., oz) per product.

-- 1. Add 'sizes' column to products table (JSONB stores the list of sizes like [{"name": "16oz", "price_adjustment": 0}])
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;

-- 2. Add 'size' column to order_items to record which size was ordered
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS size TEXT;

-- 3. (Optional) Provide a helper to ensure all existing products have an empty sizes array rather than NULL
UPDATE public.products SET sizes = '[]'::jsonb WHERE sizes IS NULL;
