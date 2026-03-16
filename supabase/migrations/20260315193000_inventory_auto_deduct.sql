
-- Function to automatically deduct stock when an order item is created
CREATE OR REPLACE FUNCTION public.deduct_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- We deduct the quantity from the product's stock_quantity
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function after each order item insertion
DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_order();
