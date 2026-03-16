-- Comprehensive SQL Migration for Customization Options
-- This script ensures all products and order_items have consistent columns for customization.

-- 1. Products table enhancements
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sugar_levels TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS ice_levels TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS flavor_options TEXT[] DEFAULT '{}'::text[];

-- Convert toppings from JSONB to TEXT[] if it exists as JSONB (to match order_items and UI usage)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'toppings' 
        AND data_type = 'jsonb'
    ) THEN
        -- 1. Rename old column
        ALTER TABLE public.products RENAME COLUMN toppings TO toppings_old;
        
        -- 2. Add new column with target type
        ALTER TABLE public.products ADD COLUMN toppings TEXT[] DEFAULT '{}'::text[];
        
        -- 3. Migrate data
        UPDATE public.products 
        SET toppings = (
            SELECT COALESCE(array_agg(x), '{}'::text[])
            FROM jsonb_array_elements_text(toppings_old) t(x)
        )
        WHERE toppings_old IS NOT NULL AND jsonb_typeof(toppings_old) = 'array';
        
        -- 4. Drop old column
        ALTER TABLE public.products DROP COLUMN toppings_old;
    END IF;
END $$;

-- 2. Order Items table enhancements
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS sugar_level TEXT,
ADD COLUMN IF NOT EXISTS ice_level TEXT,
ADD COLUMN IF NOT EXISTS flavor TEXT,
ADD COLUMN IF NOT EXISTS toppings TEXT[] DEFAULT '{}'::text[];

-- 3. Data Integrity: Ensure all products have defaults rather than NULL
UPDATE public.products SET sizes = '[]'::jsonb WHERE sizes IS NULL;
UPDATE public.products SET sugar_levels = '{}'::text[] WHERE sugar_levels IS NULL;
UPDATE public.products SET ice_levels = '{}'::text[] WHERE ice_levels IS NULL;
UPDATE public.products SET flavor_options = '{}'::text[] WHERE flavor_options IS NULL;
UPDATE public.products SET toppings = '{}'::text[] WHERE toppings IS NULL;
