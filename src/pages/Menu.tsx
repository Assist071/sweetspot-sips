import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import ProductCard from "@/components/menu/ProductCard";
import CustomizeModal from "@/components/menu/CustomizeModal";
import { motion } from "framer-motion";

export default function MenuPage() {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Tables<"products"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*").eq("is_available", true).order("name"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-display font-bold mb-2">Our Menu</h1>
      <p className="text-muted-foreground mb-8">Choose your perfect drink</p>

      {/* Category chips */}
      <div className="flex flex-wrap gap-3 mb-10 sticky top-16 z-10 bg-background/80 backdrop-blur-md py-4 sm:py-6">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-6 py-2.5 rounded-full text-sm font-display font-bold transition-all shadow-card ${
            !activeCategory ? "bg-primary text-primary-foreground shadow-hover scale-105" : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-2.5 rounded-full text-sm font-display font-bold transition-all shadow-card ${
              activeCategory === cat.id ? "bg-primary text-primary-foreground shadow-hover scale-105" : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-[2rem] overflow-hidden animate-pulse border border-primary/5">
              <div className="aspect-[4/5] bg-primary/5" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-primary/5 rounded-lg w-3/4" />
                <div className="h-4 bg-primary/5 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-6xl mb-4">🧋</p>
          <p>No drinks available yet. Check back soon!</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onQuickAdd={setSelectedProduct} />
          ))}
        </motion.div>
      )}

      <CustomizeModal product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
