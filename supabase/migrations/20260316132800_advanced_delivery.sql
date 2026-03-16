-- Migration for Advanced Delivery Features
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS lat NUMERIC(10,8);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS lng NUMERIC(11,8);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_id UUID REFERENCES auth.users(id);

-- Create table for real-time rider tracking
CREATE TABLE IF NOT EXISTS public.rider_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    lat NUMERIC(10,8) NOT NULL,
    lng NUMERIC(11,8) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable realtime for rider_locations
ALTER PUBLICATION supabase_realtime ADD TABLE rider_locations;

-- RLS for rider_locations
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders can update their own location"
    ON public.rider_locations FOR ALL
    USING (auth.uid() = rider_id);

CREATE POLICY "Customers can view rider locations for their orders"
    ON public.rider_locations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.rider_id = rider_locations.rider_id 
        AND orders.user_id = auth.uid()
        AND orders.status = 'out_for_delivery'
    ));

-- Notification log table (prepared for SMS/Push)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    order_id UUID REFERENCES public.orders(id) NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'status_update', 'rider_arriving', etc.
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);
