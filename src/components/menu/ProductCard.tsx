import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

interface ProductCardProps {
  product: Tables<"products">;
  onQuickAdd: (product: Tables<"products">) => void;
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group bg-white/80 backdrop-blur-xl rounded-3xl p-3 shadow-card border border-white/40 hover:shadow-soft transition-all duration-500 flex flex-col relative overflow-hidden"
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-primary/5 border border-primary/5 group-hover:scale-[1.02] transition-transform duration-500">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-primary/5">🧋</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-foreground">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-end mt-3">
          <Button size="icon" variant="default" className="rounded-full h-9 w-9" onClick={() => onQuickAdd(product)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
