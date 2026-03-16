import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Search, Calendar, CreditCard, ShoppingBag, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  total_spent: number;
  orders_count: number;
  last_order_date: string | null;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profileError) {
        console.error("Error fetching profiles:", profileError);
        setLoading(false);
        return;
      }

      // Fetch all orders to aggregate data
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("user_id, total_amount, created_at");

      if (orderError) {
        console.error("Error fetching orders for aggregation:", orderError);
        setLoading(false);
        return;
      }

      // Aggregate data
      const enrichedProfiles = profiles.map(profile => {
        const userOrders = orders.filter(o => o.user_id === profile.user_id);
        const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const lastOrder = userOrders.length > 0 
          ? userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at 
          : null;

        return {
          ...profile,
          total_spent: totalSpent,
          orders_count: userOrders.length,
          last_order_date: lastOrder
        };
      });

      setCustomers(enrichedProfiles);
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">Manage your relationships and track customer loyalty.</p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by name or phone..." 
            className="pl-11 h-12 rounded-2xl bg-white/50 backdrop-blur-sm border-white/20 focus:bg-white transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/50 animate-pulse rounded-2xl border border-white/40" />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-primary/10">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-primary/30" />
          </div>
          <p className="text-muted-foreground italic font-medium">No customers found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-card border border-white/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                  <th className="py-8 px-8 font-black">Customer Details</th>
                  <th className="py-8 px-8 font-black">Engagement</th>
                  <th className="py-8 px-8 font-black">Recent Activity</th>
                  <th className="py-8 px-8 font-black text-right">Loyalty Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                <AnimatePresence>
                  {filteredCustomers.map((p, idx) => (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-primary/[0.02] transition-colors"
                    >
                      <td className="py-7 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-sm group-hover:scale-110 transition-transform duration-300">
                            {p.full_name?.charAt(0) || <User className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-display font-bold text-lg text-foreground/90 truncate">{p.full_name || "Guest Account"}</p>
                            <div className="flex items-center gap-3 mt-1 text-muted-foreground/70">
                              <div className="flex items-center gap-1.5 text-xs font-medium">
                                <Phone className="h-3 w-3" />
                                {p.phone || "No phone"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-7 px-8">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60">
                            <Calendar className="h-3.5 w-3.5" />
                            Joined {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-primary">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            {p.orders_count} Total Orders
                          </div>
                        </div>
                      </td>
                      <td className="py-7 px-8">
                        {p.last_order_date ? (
                          <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Last Order</p>
                            <p className="text-sm font-bold text-foreground/70">
                              {new Date(p.last_order_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs italic text-muted-foreground/40">Never ordered yet</p>
                        )}
                      </td>
                      <td className="py-7 px-8 text-right">
                        <div className="inline-flex flex-col items-end">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Total Spent</p>
                          <div className="flex items-baseline gap-1 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                            <span className="text-sm font-bold text-primary">₱</span>
                            <span className="text-xl font-display font-black text-foreground">{p.total_spent.toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
