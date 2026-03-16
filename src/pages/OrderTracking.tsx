import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import type { Tables } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, MapPin, ChevronRight, ShoppingBag } from "lucide-react";
import OrderProgressBar from "@/components/orders/OrderProgressBar";
import RiderLiveMap from "@/components/delivery/RiderLiveMap";

type Order = Tables<"orders"> & { order_items: Tables<"order_items">[] };

export default function OrderTracking() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setOrders(data as Order[]);
      setLoading(false);
    };
    fetchOrders();

    const channel = supabase
      .channel("user-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Package className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Sign in to track orders</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">You need to be logged in to view your order history and real-time status.</p>
        <Button asChild size="lg" className="rounded-full px-8 shadow-soft"><Link to="/login">Sign In Now</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-display font-bold tracking-tight">Order History</h1>
          <p className="text-muted-foreground">Track and manage your recent Sip & Tambay treats.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
          <ShoppingBag className="h-4 w-4" />
          <span>{orders.length} Total Orders</span>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/50 backdrop-blur-sm rounded-[2rem] h-48 animate-pulse border border-primary/5" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-primary/10"
        >
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-primary/40" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-2 text-foreground/80">No orders yet</h3>
          <p className="text-muted-foreground mb-8">Craving something sweet? Start your journey today!</p>
          <Button asChild size="lg" className="rounded-full px-10 shadow-soft"><Link to="/menu">Explore Menu</Link></Button>
        </motion.div>
      ) : (
        <div className="grid gap-8">
          <AnimatePresence mode="popLayout">
            {orders.map((order, idx) => (
              <motion.div 
                key={order.id} 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-card border border-white/40 hover:shadow-soft transition-all duration-300"
              >
                <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8">
                  {/* Left Column: Order Info */}
                  <div className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <OrderStatusBadge status={order.status} />
                      {order.notes?.includes("[PICKED_UP]") && (
                        <div className="bg-success text-success-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                          <Package className="h-3 w-3" />
                          Picked Up
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-bold text-primary border border-primary/10 shadow-sm">
                              {item.quantity}x
                            </div>
                            <div>
                              <p className="font-bold text-base text-foreground/90 group-hover/item:text-primary transition-colors">{item.product_name}</p>
                              {item.sugar_level && (
                                <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
                                  {item.sugar_level} Sugar · {item.ice_level || 'Regular Ice'}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="font-display font-bold text-foreground/70">₱{(item.unit_price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Live Tracking Map */}
                    {(order.status as any) === "out_for_delivery" && (order as any).lat && (order as any).lng && (
                      <div className="pt-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                          Live Delivery Tracking
                        </p>
                        <RiderLiveMap 
                          riderId={(order as any).rider_id || ""} 
                          customerLat={Number((order as any).lat)}
                          customerLng={Number((order as any).lng)}
                        />
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="pt-4 border-t border-primary/5">
                      <OrderProgressBar status={order.status as any} />
                    </div>
                  </div>

                  {/* Right Column: Metadata & Total */}
                  <div className="md:w-64 flex flex-col justify-between gap-6 bg-primary/[0.02] rounded-[2rem] p-6 border border-primary/5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary/60" />
                        <span className="text-sm font-medium">
                          {new Date(order.created_at).toLocaleDateString(undefined, { 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary/60" />
                        <span className="text-sm font-medium capitalize">{order.order_type}</span>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-primary/10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Total Amount</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-primary">₱</span>
                        <span className="text-3xl font-display font-black text-foreground">{Number(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-primary/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm">
                      Reorder
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
