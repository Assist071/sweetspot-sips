-- Migration to add delivery enhancements
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'delivered';

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0;
