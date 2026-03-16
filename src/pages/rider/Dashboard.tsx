import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Bike, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Navigation,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import MapPicker from "@/components/delivery/MapPicker";

import type { Tables, Database } from "@/integrations/supabase/client";

type Order = Tables<"orders"> & { 
  order_items: Tables<"order_items">[]
};

export default function RiderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGpsActive, setIsGpsActive] = useState(false);

  const fetchOrders = async () => {
    try {
      // Available orders: status = 'complete' (ready for pickup) and order_type = 'delivery'
      const { data: available } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_type", "delivery")
        .eq("status", "complete")
        .is("rider_id", null)
        .order("created_at", { ascending: false });

      // Active orders: assigned to this rider and in 'out_for_delivery' status
      const { data: active } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("rider_id", user?.id)
        .eq("status", "out_for_delivery")
        .order("updated_at", { ascending: false });

      if (available) setAvailableOrders(available);
      if (active) setActiveOrders(active);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchOrders();

    const channel = supabase
      .channel("rider-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const acceptOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ 
        status: "out_for_delivery", 
        rider_id: user?.id 
      })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Order Accepted!", description: "Check your active orders tab." });
      fetchOrders();
    }
  };

  const completeDelivery = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Delivery Complete! 🏁", description: "Good job, rider!" });
      fetchOrders();
    }
  };

  const updateLocation = async (lat: number, lng: number) => {
    if (!user) return;
    const { error } = await supabase
      .from("rider_locations")
      .upsert({ 
        rider_id: user.id, 
        lat, 
        lng,
        updated_at: new Date().toISOString()
      });
    
    if (error) console.error("GPS Update Error:", error);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Rider Dashboard</h1>
          <p className="text-muted-foreground mt-1">Ready for your next delivery mission?</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-primary/5">
          <div className={`w-3 h-3 rounded-full ${isGpsActive ? 'bg-success animate-pulse' : 'bg-muted-foreground/30'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">
            GPS tracking: {isGpsActive ? "Active" : "Inactive"}
          </span>
          <Button 
            size="sm" 
            variant={isGpsActive ? "destructive" : "default"}
            className="h-8 rounded-xl text-[10px] uppercase font-bold px-4"
            onClick={() => setIsGpsActive(!isGpsActive)}
          >
            {isGpsActive ? "Stop" : "Go Online"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Available Orders Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-orange-500" />
            </div>
            <h2 className="font-display font-bold text-xl">Available Deliveries</h2>
            <span className="ml-auto bg-orange-500/10 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full">
              {availableOrders.length} New
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {availableOrders.map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="p-6 rounded-[2rem] border-white/40 shadow-soft hover:shadow-hover transition-all duration-300 group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Order ID: #{order.id.slice(0, 8)}</span>
                        <h3 className="font-display font-bold text-lg">Delivery to {order.delivery_address?.split(',')[0]}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(order.created_at))} ago
                      </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/5 mb-6">
                      <p className="text-xs text-foreground/60 font-medium mb-2">Customer Instructions:</p>
                      <p className="text-sm italic text-foreground/80">"{order.notes || "No special instructions"}"</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {order.order_items.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm">
                            {item.quantity}
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">
                            +{order.order_items.length - 3}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => acceptOrder(order.id)}
                        className="rounded-full px-6 font-bold uppercase text-[11px] h-10 shadow-soft"
                      >
                        Accept Delivery
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {availableOrders.length === 0 && (
              <div className="text-center py-20 bg-white/40 rounded-[3rem] border-2 border-dashed border-primary/10">
                <Bike className="h-10 w-10 text-primary/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium italic">No new delivery orders at the moment...</p>
              </div>
            )}
          </div>
        </section>

        {/* Active Deliveries Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Navigation className="h-4 w-4 text-success" />
            </div>
            <h2 className="font-display font-bold text-xl">On the Road</h2>
            {activeOrders.length > 0 && (
              <span className="ml-auto bg-success/10 text-success-600 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                Live
              </span>
            )}
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {activeOrders.map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="overflow-hidden rounded-[2.5rem] border-2 border-success/20 shadow-soft">
                    <div className="p-6 border-b border-primary/5 bg-success/5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-white shadow-soft">
                              <MapPin className="h-5 w-5" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-success">Active Destination</p>
                              <p className="font-display font-bold text-foreground truncate max-w-[200px]">{order.delivery_address}</p>
                           </div>
                        </div>
                        <Button variant="outline" size="icon" className="rounded-xl border-success/20 text-success hover:bg-success/10" asChild>
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="p-2 h-[300px]">
                       <MapPicker 
                          initialLocation={[Number(order.lat), Number(order.lng)]}
                          onLocationSelect={(lat, lng) => {
                            if (isGpsActive) updateLocation(lat, lng);
                          }}
                       />
                    </div>

                    <div className="p-6 bg-white border-t border-primary/5 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Earnings for this trip</p>
                          <p className="text-xl font-display font-black text-primary">₱{order.delivery_fee?.toFixed(2) || "50.00"}</p>
                       </div>
                       <Button 
                        onClick={() => completeDelivery(order.id)}
                        className="bg-success hover:bg-success/90 rounded-full px-8 font-black uppercase text-[11px] h-12 shadow-soft"
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Complete Delivery
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {activeOrders.length === 0 && (
              <div className="text-center py-20 bg-muted/5 rounded-[3rem] border-2 border-dashed border-muted-foreground/10 opacity-50">
                <p className="text-muted-foreground font-medium italic">No active deliveries. Pick one up!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
