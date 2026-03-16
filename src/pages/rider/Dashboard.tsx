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
  ChevronRight,
  Utensils,
  Truck,
  Home,
  Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import MapPicker from "@/components/delivery/MapPicker";

import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders"> & { 
  order_items: Tables<"order_items">[]
};

// FoodPanda-style status steps
const STATUS_FLOW = [
  { key: "pending", label: "Order Received", icon: Clock, color: "blue" },
  { key: "preparing", label: "Preparing", icon: Utensils, color: "orange" },
  { key: "complete", label: "Ready for Pickup", icon: Package, color: "amber" },
  { key: "out_for_delivery", label: "On the Way", icon: Truck, color: "green" },
  { key: "delivered", label: "Delivered", icon: Home, color: "emerald" },
];

function getStatusIndex(status: string) {
  return STATUS_FLOW.findIndex(s => s.key === status);
}

function getNextStatus(currentStatus: string): string | null {
  const idx = getStatusIndex(currentStatus);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1].key;
}

function getNextLabel(currentStatus: string): string {
  const next = getNextStatus(currentStatus);
  if (!next) return "Done";
  const step = STATUS_FLOW.find(s => s.key === next);
  return step?.label || "Next";
}

export default function RiderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGpsActive, setIsGpsActive] = useState(false);

  const fetchOrders = async () => {
    try {
      // Available: unclaimed delivery orders
      const { data: available } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_type", "delivery")
        .in("status", ["pending", "preparing", "complete"])
        .is("rider_id", null)
        .order("created_at", { ascending: false });

      // Active: orders claimed by this rider, not yet delivered
      const { data: active } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("rider_id", user?.id)
        .in("status", ["pending", "preparing", "complete", "out_for_delivery"])
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
      .update({ rider_id: user?.id })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🛵 Order Accepted!", description: "You've got a new delivery!" });
      fetchOrders();
    }
  };

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus as any })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const step = STATUS_FLOW.find(s => s.key === nextStatus);
      toast({ 
        title: nextStatus === "delivered" ? "🏁 Delivery Complete!" : `✅ ${step?.label}`,
        description: nextStatus === "delivered" ? "Great job, rider!" : "Status updated successfully." 
      });
      fetchOrders();
    }
  };

  const updateLocation = async (lat: number, lng: number) => {
    if (!user) return;
    const { error } = await supabase
      .from("rider_locations")
      .upsert({ 
        rider_id: user.id, lat, lng,
        updated_at: new Date().toISOString()
      });
    if (error) console.error("GPS Update Error:", error);
  };

  // ─── Progress Bar Component (FoodPanda-style) ─────────────
  const StatusProgressBar = ({ status }: { status: string }) => {
    const currentIndex = getStatusIndex(status);
    return (
      <div className="flex items-center gap-1 w-full">
        {STATUS_FLOW.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isActive = i === currentIndex;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-center">
                {i > 0 && (
                  <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    isCompleted || isActive ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                  isCompleted ? 'bg-primary text-white scale-90' :
                  isActive ? 'bg-primary text-white scale-110 ring-4 ring-primary/20 shadow-lg' :
                  'bg-muted text-muted-foreground/40'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider text-center leading-tight ${
                isActive ? 'text-primary' : isCompleted ? 'text-foreground/60' : 'text-muted-foreground/30'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Rider Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your delivery missions, FoodPanda-style 🛵</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-primary/5">
          <div className={`w-3 h-3 rounded-full ${isGpsActive ? 'bg-success animate-pulse' : 'bg-muted-foreground/30'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">
            GPS: {isGpsActive ? "Active" : "Off"}
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

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl text-center border-blue-500/10 bg-blue-50/50">
          <p className="text-2xl font-display font-black text-blue-600">{availableOrders.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Available</p>
        </Card>
        <Card className="p-4 rounded-2xl text-center border-orange-500/10 bg-orange-50/50">
          <p className="text-2xl font-display font-black text-orange-600">{activeOrders.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Active</p>
        </Card>
        <Card className="p-4 rounded-2xl text-center border-green-500/10 bg-green-50/50">
          <p className="text-2xl font-display font-black text-green-600">₱{activeOrders.reduce((sum, o) => sum + (Number(o.delivery_fee) || 50), 0).toFixed(0)}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-400">Earnings</p>
        </Card>
      </div>

      {/* ═══════ ACTIVE ORDERS (FoodPanda-style cards) ═══════ */}
      {activeOrders.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Navigation className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display font-bold text-xl">Active Deliveries</h2>
            <span className="ml-auto bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full animate-pulse">
              🔴 Live
            </span>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {activeOrders.map((order) => {
                const currentStep = STATUS_FLOW.find(s => s.key === order.status);
                const nextLabel = getNextLabel(order.status);
                const nextStatus = getNextStatus(order.status);
                const isLastStep = order.status === "out_for_delivery";

                return (
                  <motion.div
                    layout
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="overflow-hidden rounded-[2rem] border-2 border-primary/10 shadow-soft">
                      {/* Order Header */}
                      <div className="p-5 bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/5">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-soft ${
                              order.status === 'out_for_delivery' ? 'bg-green-500' : 
                              order.status === 'complete' ? 'bg-amber-500' :
                              order.status === 'preparing' ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                              {currentStep && <currentStep.icon className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                #{order.id.slice(0, 8)}
                              </p>
                              <p className="font-display font-bold text-foreground">
                                {currentStep?.label}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Earnings</p>
                            <p className="text-lg font-display font-black text-primary">
                              ₱{Number(order.delivery_fee || 50).toFixed(0)}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <StatusProgressBar status={order.status} />
                      </div>

                      {/* Delivery Details */}
                      <div className="p-5 space-y-4">
                        {/* Address */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Deliver to</p>
                            <p className="font-bold text-foreground">{order.delivery_address || "No address"}</p>
                          </div>
                          <Button variant="outline" size="icon" className="rounded-xl shrink-0 border-primary/10" asChild>
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>

                        {/* Order Items */}
                        <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">Order Items</p>
                          {order.order_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-foreground/80">
                                <span className="font-bold text-primary">{item.quantity}×</span> {item.product_name}
                              </span>
                              <span className="font-bold text-foreground/60">₱{(item.unit_price * item.quantity).toFixed(0)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-primary/5 pt-2 mt-2">
                            <span className="text-xs font-bold text-foreground/60">Total</span>
                            <span className="font-display font-black text-primary">₱{Number(order.total_amount).toFixed(0)}</span>
                          </div>
                        </div>

                        {/* Map (show when out for delivery) */}
                        {order.status === "out_for_delivery" && order.lat && order.lng && (
                          <div className="rounded-2xl overflow-hidden h-[200px] border border-primary/10">
                            <MapPicker 
                              initialLocation={[Number(order.lat), Number(order.lng)]}
                              onLocationSelect={(lat, lng) => {
                                if (isGpsActive) updateLocation(lat, lng);
                              }}
                            />
                          </div>
                        )}

                        {/* Notes */}
                        {order.notes && (
                          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Customer Notes</p>
                            <p className="text-sm text-amber-800 italic">"{order.notes}"</p>
                          </div>
                        )}
                      </div>

                      {/* Action Button — THE BIG SWIPE BUTTON */}
                      {nextStatus && (
                        <div className="p-5 pt-0">
                          <Button 
                            onClick={() => advanceStatus(order.id, order.status)}
                            className={`w-full h-14 rounded-2xl font-black uppercase text-sm tracking-wider shadow-soft transition-all duration-300 ${
                              isLastStep 
                                ? 'bg-green-500 hover:bg-green-600 text-white' 
                                : 'bg-primary hover:bg-primary/90 text-white'
                            }`}
                          >
                            {isLastStep ? (
                              <>
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Complete Delivery
                              </>
                            ) : (
                              <>
                                <ChevronRight className="mr-2 h-5 w-5" />
                                Mark as: {nextLabel}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ═══════ AVAILABLE ORDERS ═══════ */}
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
                <Card className="rounded-[2rem] border-white/40 shadow-soft hover:shadow-hover transition-all duration-300 overflow-hidden">
                  {/* Color strip on the left */}
                  <div className="flex">
                    <div className={`w-2 shrink-0 ${
                      order.status === 'pending' ? 'bg-blue-500' :
                      order.status === 'preparing' ? 'bg-orange-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">#{order.id.slice(0, 8)}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              order.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                              order.status === 'preparing' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {order.status === 'pending' ? '🔵 New' : order.status === 'preparing' ? '🟠 Preparing' : '🟢 Ready'}
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-base">{order.delivery_address?.split(',')[0] || "Delivery Order"}</h3>
                          <p className="text-xs text-muted-foreground">
                            {order.order_items.length} item{order.order_items.length > 1 ? 's' : ''} · ₱{Number(order.total_amount).toFixed(0)} · {formatDistanceToNow(new Date(order.created_at))} ago
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-display font-black text-primary">₱{Number(order.delivery_fee || 50).toFixed(0)}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Fee</p>
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="flex items-center gap-2 mb-4">
                        {order.order_items.slice(0, 3).map((item: any, i: number) => (
                          <span key={i} className="text-xs bg-muted/50 px-2 py-1 rounded-lg text-foreground/70 font-medium">
                            {item.quantity}× {item.product_name.length > 15 ? item.product_name.substring(0, 15) + '...' : item.product_name}
                          </span>
                        ))}
                        {order.order_items.length > 3 && (
                          <span className="text-xs text-primary font-bold">+{order.order_items.length - 3} more</span>
                        )}
                      </div>

                      <Button 
                        onClick={() => acceptOrder(order.id)}
                        className="w-full rounded-xl px-6 font-bold uppercase text-[11px] h-11 shadow-soft bg-primary hover:bg-primary/90"
                      >
                        🛵 Accept Delivery
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {availableOrders.length === 0 && (
            <div className="text-center py-20 bg-white/40 rounded-[3rem] border-2 border-dashed border-primary/10">
              <Bike className="h-10 w-10 text-primary/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium italic">No new delivery orders at the moment...</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Orders will appear here when customers choose delivery</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
