import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import MapPicker from "@/components/delivery/MapPicker";

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        const p = data;
        const parts = [
          p.complete_address,
          p.barangay,
          p.city,
          p.zip_code
        ].filter(Boolean);

        if (parts.length > 0) {
          setAddress(parts.join(", "));
        }
      }
      setProfileLoading(false);
    };

    fetchProfile();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleCheckout = async () => {
    setLoading(true);
    // Verify stock and deduct
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.productId)
        .single();

      if (!product || (product.stock_quantity !== null && product.stock_quantity < item.quantity)) {
        toast({
          title: "Out of stock",
          description: `Sorry, ${item.name} is out of stock.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
    }

    const deliveryFee = orderType === "delivery" ? 50 : 0;
    const finalTotal = total + deliveryFee;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_type: orderType,
        total_amount: finalTotal,
        delivery_fee: deliveryFee,
        delivery_address: orderType === "delivery" ? address : null,
        lat: orderType === "delivery" ? coords?.lat : null,
        lng: orderType === "delivery" ? coords?.lng : null,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      toast({ title: "Order failed", description: orderError?.message || "Something went wrong", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create order items
    // Stock deduction is now handled automatically via database trigger for reliability and security
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      sugar_level: item.sugarLevel || null,
      ice_level: item.iceLevel || null,
      flavor: item.flavor || null,
      size: item.size || null,
      toppings: item.toppings.length > 0 ? item.toppings : null,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      toast({ title: "Error saving items", description: itemsError.message, variant: "destructive" });
    } else {
      clearCart();
      toast({ title: "Order placed! 🎉", description: "Your stock has been updated automatically." });
      navigate("/orders");
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-display font-bold mb-6">Checkout</h1>

      {/* Order Type */}
      <div className="bg-card rounded-2xl p-6 mb-6">
        <h2 className="font-display font-bold mb-4">Order Type</h2>
        <div className="flex gap-3">
          {(["pickup", "delivery"] as const).map((t) => (
            <Button key={t} variant={orderType === t ? "default" : "outline"} onClick={() => setOrderType(t)} className="flex-1 capitalize">
              {t}
            </Button>
          ))}
        </div>
        {orderType === "delivery" && (
          <div className="mt-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required className="rounded-xl" placeholder="Enter your full address" />
            </div>

            <MapPicker 
              onLocationSelect={(lat, lng) => setCoords({ lat, lng })}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-card rounded-2xl p-6 mb-6">
        <Label htmlFor="notes">Special Instructions</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl mt-2" placeholder="Any special requests?" />
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl p-6 mb-6">
        <h2 className="font-display font-bold mb-4">Order Summary</h2>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div className="flex flex-col">
                <span>{item.quantity}x {item.name} {item.size && <span className="text-xs text-primary/70 italic">({item.size})</span>}</span>
                {item.flavor && <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest pl-5">{item.flavor}</span>}
              </div>
              <span className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {orderType === "delivery" && (
            <div className="flex justify-between text-sm text-primary/70 italic">
              <span>Delivery Fee</span>
              <span>₱50.00</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2 flex justify-between font-display font-bold text-lg">
            <span>Total</span>
            <span>₱{(total + (orderType === "delivery" ? 50 : 0)).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading || (orderType === "delivery" && !address)}>
        {loading ? "Placing Order..." : `Place Order — ₱${(total + (orderType === "delivery" ? 50 : 0)).toFixed(2)}`}
      </Button>
    </div>
  );
}
