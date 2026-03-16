import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, DollarSign, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      
      if (orders) {
        setStats({
          totalOrders: orders.length,
          totalRevenue: orders.reduce((s, o) => s + Number(o.total_amount), 0),
          pendingOrders: orders.filter((o) => o.status === "pending").length,
          completedOrders: orders.filter((o) => o.status === "complete").length,
        });
        setRecentOrders(orders.slice(0, 5));
      }

      const { data: lowStock } = await supabase
        .from("products")
        .select("*")
        .lte("stock_quantity", 10)
        .order("stock_quantity");
      
      if (lowStock) setLowStockProducts(lowStock);
    };
    loadStats();
  }, []);

  const cards = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-primary/10 text-primary" },
    { label: "Revenue", value: `₱${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "bg-success/20 text-foreground" },
    { label: "Pending", value: stats.pendingOrders, icon: TrendingUp, color: "bg-[hsl(40,80%,60%)]/20 text-foreground" },
    { label: "Completed", value: stats.completedOrders, icon: Users, color: "bg-success/20 text-foreground" },
  ];

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-4xl font-display font-black tracking-tighter text-foreground">
            Dashboard <span className="text-primary italic">Overview</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Welcome back, Admin. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/40 shadow-soft">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">System Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div 
            key={card.label} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            className="glass rounded-[2rem] p-8 group hover:shadow-hover hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors" />
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-soft ${card.color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
              <card.icon className="h-7 w-7" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/50 mb-1">{card.label}</p>
            <p className="text-3xl font-display font-black tracking-tight text-foreground">{card.value}</p>
          </motion.div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Recent Orders */}
        <div className="lg:col-span-2 glass rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mt-32 blur-3xl opacity-50" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="font-display font-black text-2xl tracking-tight">Recent <span className="text-primary italic">Activity</span></h2>
            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
              View All
            </button>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-primary/10 rounded-[2rem] bg-primary/5 relative z-10">
              <div className="text-4xl mb-4">📜</div>
              <p className="text-muted-foreground font-medium italic">No orders recorded yet.</p>
            </div>
          ) : (
            <div className="relative z-10 space-y-4">
              {recentOrders.map((o, idx) => (
                <motion.div 
                  key={o.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-white/40 border border-white/60 hover:bg-white/80 hover:shadow-soft transition-all duration-300 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-warm border border-white/60 flex items-center justify-center font-display font-black text-primary/40 text-xs shadow-soft">
                      #{idx + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-sm tracking-tight text-foreground">#{o.id.slice(0, 8).toUpperCase()}</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {o.order_items?.map((item: any) => (
                          <span key={item.id} className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                            {item.quantity}x {item.product_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-8">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Status</span>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        o.status === "complete" ? "bg-success/10 text-success border border-success/20" : 
                        o.status === "pending" ? "bg-primary/10 text-primary border border-primary/20" : 
                        "bg-muted/50 text-muted-foreground border border-muted"
                      }`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Total</span>
                      <span className="font-display font-black text-lg text-foreground tracking-tight">₱{Number(o.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="glass rounded-[2.5rem] p-8 border-destructive/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-destructive/10 transition-colors" />
          
          <div className="flex items-center gap-3 mb-8 text-destructive relative z-10">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shadow-soft">
              <TrendingUp className="h-5 w-5 rotate-180" />
            </div>
            <h2 className="font-display font-black text-xl tracking-tight">Stock <span className="italic">Alerts</span></h2>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-12 rounded-[2rem] bg-success/5 border border-success/10 relative z-10 group/success">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover/success:scale-110 transition-transform duration-500">
                <span className="text-4xl animate-bounce">🎉</span>
              </div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-success/60">Fully Stocked</p>
              <p className="text-[11px] text-success/40 mt-1 font-medium">Monitoring all inventory...</p>
            </div>
          ) : (
            <div className="space-y-8 relative z-10">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="font-display font-bold text-base text-foreground tracking-tight truncate pr-4">{p.name}</p>
                    <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full whitespace-nowrap ${
                      p.stock_quantity === 0 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-orange-500/10 text-orange-600'
                    }`}>
                      {p.stock_quantity === 0 ? 'Out of Stock' : `Low Stock • ${p.stock_quantity} Left`}
                    </span>
                  </div>
                  <div className="w-full bg-destructive/5 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (p.stock_quantity / 10) * 100)}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className={`h-full rounded-full ${p.stock_quantity === 0 ? 'bg-destructive/30' : 'bg-destructive'}`} 
                    />
                  </div>
                </div>
              ))}
              <div className="pt-6">
                <button className="w-full py-6 rounded-[2rem] bg-destructive text-white font-black text-xs uppercase tracking-[0.1em] hover:bg-destructive/90 hover:shadow-hover transition-all duration-300 shadow-soft">
                  Restock Essential Items
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
