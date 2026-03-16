import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { Tables, Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PlayCircle, XCircle, Clock } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type Order = Tables<"orders"> & { 
  order_items: Tables<"order_items">[]
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { sendStatusNotification } = useNotifications();

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_type", "pickup")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (data) setOrders(data as Order[]);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({ title: "Fetch Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const updateData: Database["public"]["Tables"]["orders"]["Update"] = { status };
    
    // Orders now wait for a real rider to accept them from the Rider Dashboard
    // when the status becomes 'complete' and rider_id is null.
    
    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Order status changed to ${status}` });
      // Send notification
      const order = orders.find(o => o.id === orderId);
      if (order?.user_id) {
        sendStatusNotification(order.user_id, orderId, status);
      }
    }
  };

  const markAsPickedUp = async (orderId: string, currentNotes: string | null) => {
    const newNotes = currentNotes ? `${currentNotes} [PICKED_UP]` : "[PICKED_UP]";
    const { error } = await supabase.from("orders").update({ notes: newNotes }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Order marked as Picked Up" });
    }
  };

  const simulateRiderMovement = async (riderId: string, customerLat: number, customerLng: number) => {
    // Simulate a point closer to the customer
    const mockLat = customerLat + (Math.random() - 0.5) * 0.01;
    const mockLng = customerLng + (Math.random() - 0.5) * 0.01;

    const { error } = await supabase
      .from("rider_locations")
      .upsert({ 
        rider_id: riderId, 
        lat: mockLat, 
        lng: mockLng
      });

    if (error) {
      toast({ title: "Simulate Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rider location updated! Check the customer's map." });
    }
  };

  const columns: { title: string; status: string; style: string; icon: any }[] = [
    { title: "Incoming", status: "pending", style: "bg-secondary/40 backdrop-blur-sm", icon: Clock },
    { title: "Preparing", status: "preparing", style: "bg-primary/10 backdrop-blur-sm", icon: PlayCircle },
    { title: "Active", status: "active", style: "bg-blue-500/10 backdrop-blur-sm", icon: CheckCircle2 },
    { title: "Finished", status: "finished", style: "bg-success/10 backdrop-blur-sm", icon: CheckCircle2 },
  ];

  const getOrdersByStatus = (status: string) => {
    if (status === "active") {
      return orders.filter(o => 
        (o.status === "complete" && !o.notes?.includes("[PICKED_UP]")) || 
        o.status === "out_for_delivery"
      );
    }
    if (status === "finished") {
      return orders.filter(o => 
        o.status === "delivered" || 
        (o.status === "complete" && o.notes?.includes("[PICKED_UP]"))
      ).slice(0, 10); // Show only recent 10 finished
    }
    return orders.filter(o => o.status === status);
  };

  return (
    <div className="space-y-8 pb-12 px-2">
      <div className="flex flex-col mb-4">
        <h1 className="text-4xl font-display font-bold tracking-tight">Order Workflow</h1>
        <p className="text-muted-foreground mt-1">Manage your kitchen queue with live updates.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[75vh]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-muted/20 rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {columns.map((col) => (
            <div key={col.status} className={`rounded-[2.5rem] p-6 ${col.style} min-h-[75vh] border border-white/20 shadow-sm transition-all duration-300`}>
              <div className="flex items-center justify-between px-2 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/50 flex items-center justify-center shadow-sm">
                    <col.icon className="h-5 w-5 text-foreground/70" />
                  </div>
                  <h2 className="font-display font-bold text-lg tracking-tight">
                    {col.title}
                  </h2>
                </div>
                <span className="bg-white/80 backdrop-blur-md text-xs w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-soft border border-white/50">
                  {getOrdersByStatus(col.status).length}
                </span>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {getOrdersByStatus(col.status).map((order) => (
                    <motion.div
                      layout
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white/80 backdrop-blur-sm rounded-[1.5rem] p-5 shadow-card hover:shadow-soft transition-all duration-300 border border-white/40 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-2">
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                          order.order_type === "delivery" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"
                        )}>
                          {order.order_type}
                        </span>
                      </div>

                      <div className="flex justify-between items-start mb-4">
                        <span className="font-display font-bold text-sm tracking-wide bg-primary/5 px-2 py-0.5 rounded-lg">#{order.id.slice(0, 4).toUpperCase()}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-tight pr-12">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(order.created_at))} 
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="font-bold text-sm text-foreground/90 mb-2 truncate">Customer #{order.user_id?.slice(0, 4) || "Guest"}</p>
                        {order.delivery_address && (
                          <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1 italic">📍 {order.delivery_address}</p>
                        )}
                        <div className="space-y-1 mt-2 bg-primary/5 p-3 rounded-xl border border-primary/5">
                          {order.order_items.map((item) => (
                            <p key={item.id} className="text-xs text-foreground/70 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-white flex items-center justify-center text-[10px] font-bold shadow-sm">{item.quantity}</span>
                              <span className="font-medium line-clamp-1 text-[11px]">{item.product_name}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-primary/5">
                        <span className="font-display font-bold text-base text-primary">
                          ₱{Number(order.total_amount).toFixed(2)}
                        </span>
                        
                        <div className="flex gap-1.5">
                          {order.status === "pending" && (
                            <Button 
                              size="sm" 
                              className="h-8 px-4 rounded-full text-[9px] font-bold uppercase bg-primary"
                              onClick={() => updateStatus(order.id, "preparing")}
                            >
                              Start
                            </Button>
                          )}
                          {order.status === "preparing" && (
                            <Button 
                              size="sm" 
                              className="h-8 px-4 rounded-full text-[9px] font-bold uppercase bg-success hover:bg-success/90"
                              onClick={() => updateStatus(order.id, order.rider_id ? "out_for_delivery" : "complete")}
                            >
                              {order.order_type === "delivery" ? "Ready to Ship" : "Done"}
                            </Button>
                          )}
                          {(order.status as any) === "out_for_delivery" && (
                            <div className="flex flex-col gap-2 w-full">
                              <Button 
                                size="sm" 
                                className="h-8 px-4 rounded-full text-[9px] font-bold uppercase bg-blue-600 hover:bg-blue-700"
                                onClick={() => updateStatus(order.id, "delivered")}
                              >
                                Delivered
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 px-4 rounded-full text-[9px] font-bold uppercase border-blue-200 text-blue-600 hover:bg-blue-50"
                                onClick={() => simulateRiderMovement(
                                  order.rider_id || "00000000-0000-0000-0000-000000000000",
                                  Number(order.lat),
                                  Number(order.lng)
                                )}
                              >
                                📡 Mock GPS Move
                              </Button>
                            </div>
                          )}
                          {order.status === "complete" && !order.notes?.includes("[PICKED_UP]") && (
                            <Button 
                              size="sm" 
                              className="h-8 px-4 rounded-full text-[9px] font-bold uppercase bg-accent"
                              onClick={() => markAsPickedUp(order.id, order.notes)}
                            >
                              Pick Up
                            </Button>
                          )}
                          {(order.status === "pending" || order.status === "preparing") && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                              onClick={() => updateStatus(order.id, "cancelled")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {getOrdersByStatus(col.status).length === 0 && (
                  <p className="text-center text-xs text-muted-foreground/50 py-10 italic">
                    No orders in {col.title}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
