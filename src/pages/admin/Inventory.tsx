import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Save, Search, AlertTriangle, Box, RefreshCcw, ArrowUpRight, TrendingDown } from "lucide-react";

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("name");
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStock = async (productId: string, newQuantity: number) => {
    setUpdating(productId);
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: newQuantity })
      .eq("id", productId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Stock updated", description: "Product inventory has been updated." });
      setProducts(products.map(p => p.id === productId ? { ...p, stock_quantity: newQuantity } : p));
    }
    setUpdating(null);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.categories?.name && p.categories.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-display font-bold tracking-tight">Stock Inventory</h1>
          <p className="text-muted-foreground">Monitor and manage your supply levels in real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Filter by name or category..." 
              className="pl-11 h-12 rounded-2xl bg-white/50 backdrop-blur-sm border-white/20 focus:bg-white transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-12 w-12 rounded-2xl border-white/40 bg-white/50 backdrop-blur-sm hover:bg-white"
            onClick={fetchProducts}
            disabled={loading}
          >
            <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white/50 rounded-2xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-card border border-white/40 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                <th className="py-8 px-8 font-black">Product Details</th>
                <th className="py-8 px-8 font-black">Flavor Group</th>
                <th className="py-8 px-8 font-black text-center">In Stock</th>
                <th className="py-8 px-8 font-black text-right">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p, idx) => (
                  <motion.tr 
                    key={p.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-primary/[0.02] transition-all duration-300"
                  >
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/5 shadow-sm group-hover:scale-110 transition-transform">
                          <Box className="h-6 w-6 text-primary/40" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-display font-bold text-lg text-foreground/90 leading-tight">{p.name}</span>
                          {p.stock_quantity < 10 && (
                            <span className="flex items-center gap-1.5 text-[10px] text-destructive font-black uppercase tracking-widest mt-1">
                              <TrendingDown className="h-3 w-3" /> Critical Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <span className="text-sm font-bold text-muted-foreground/80 bg-muted/30 px-4 py-1.5 rounded-full border border-primary/5">
                        {p.categories?.name || "Original Selection"}
                      </span>
                    </td>
                    <td className="py-6 px-8 text-center">
                      <div className="inline-flex items-center justify-center">
                         <span className={`px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${
                          p.stock_quantity < 10 
                            ? "bg-destructive/10 text-destructive border border-destructive/20" 
                            : "bg-success/10 text-success border border-success/20"
                        }`}>
                          {p.stock_quantity || 0} units
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center justify-end gap-3">
                        <div className="relative">
                          <Input 
                            type="number" 
                            defaultValue={p.stock_quantity || 0}
                            className="w-24 rounded-xl text-center h-10 bg-white/50 border-white/20 font-bold focus:ring-primary/20"
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== p.stock_quantity) {
                                handleUpdateStock(p.id, val);
                              }
                            }}
                          />
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-10 w-10 rounded-xl text-primary hover:bg-primary/10 hover:shadow-soft transition-all"
                          disabled={updating === p.id}
                        >
                          {updating === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto opacity-50">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground italic font-medium">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
