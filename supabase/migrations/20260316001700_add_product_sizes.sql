
-- Add sizes column to products and order_items
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size TEXT;

-- Initialize standard sizes for Milktea and Fruit Tea
-- We'll look for categories named 'Milktea' or 'Fruit Tea' and add default sizes to their products
DO $$
DECLARE
    milktea_cat_id UUID;
    fruit_tea_cat_id UUID;
    default_sizes JSONB := '[
        {"name": "16oz (Medium)", "price_adjustment": 0},
        {"name": "22oz (Large)", "price_adjustment": 10}
    ]'::jsonb;
BEGIN
    SELECT id INTO milktea_cat_id FROM public.categories WHERE name ILIKE '%Milktea%';
    SELECT id INTO fruit_tea_cat_id FROM public.categories WHERE name ILIKE '%Fruit Tea%';

    IF milktea_cat_id IS NOT NULL THEN
        UPDATE public.products 
        SET sizes = default_sizes
        WHERE category_id = milktea_cat_id;
    END IF;

    IF fruit_tea_cat_id IS NOT NULL THEN
        UPDATE public.products 
        SET sizes = default_sizes
        WHERE category_id = fruit_tea_cat_id;
    END IF;
END $$;
