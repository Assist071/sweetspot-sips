-- RLS Policies for Riders to view and manage delivery orders

-- Riders can view all delivery orders (to see available pickups)
CREATE POLICY "Riders can view delivery orders"
    ON public.orders FOR SELECT
    USING (
        public.has_role(auth.uid(), 'rider')
        AND order_type = 'delivery'
    );

-- Riders can update delivery orders (to accept/complete deliveries)
CREATE POLICY "Riders can update delivery orders"
    ON public.orders FOR UPDATE
    USING (
        public.has_role(auth.uid(), 'rider')
        AND order_type = 'delivery'
    );

-- Riders can view order items for delivery orders
CREATE POLICY "Riders can view delivery order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.order_type = 'delivery'
            AND public.has_role(auth.uid(), 'rider')
        )
    );
