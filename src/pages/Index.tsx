import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Clock, Truck } from "lucide-react";
import heroBoba from "@/assets/hero-boba.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import ProductCard from "@/components/menu/ProductCard";
import CustomizeModal from "@/components/menu/CustomizeModal";

export default function Index() {
  const [featured, setFeatured] = useState<Tables<"products">[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Tables<"products"> | null>(null);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_featured", true)
      .eq("is_available", true)
      .limit(4)
      .then(({ data }) => {
        if (data) setFeatured(data);
      });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-warm min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 space-y-8"
          >
            <h1 className="text-6xl md:text-8xl font-display font-bold leading-tight text-foreground">
              Freshly Brewed<br />
              <span className="text-primary italic">Happiness</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Hand-crafted boba tea made with premium ingredients. Customize your perfect drink and enjoy pure bliss.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/menu">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold gap-2 rounded-full px-8">
                  Order Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/menu">
                <Button variant="outline" size="lg" className="rounded-full bg-background/50 backdrop-blur-sm border-primary/20" asChild>
                  <Link to="/menu">View Menu</Link>
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 max-w-xl relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10 animate-pulse" />
            <img src={heroBoba} alt="Delicious boba milk tea" className="rounded-[2.5rem] shadow-soft w-full object-cover aspect-[4/5] md:aspect-square" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Star, title: "Premium Quality", desc: "Only the finest tea leaves and fresh ingredients for that perfect cup." },
              { icon: Clock, title: "Quick & Fresh", desc: "Your drink, freshly prepared in minutes whenever you need it." },
              { icon: Truck, title: "Pickup or Delivery", desc: "Order your way, hassle-free. Your favorite boba, delivered." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-[2rem] bg-card shadow-card hover:shadow-soft transition-all duration-300 border border-primary/5"
              >
                <div className="w-16 h-16 gradient-warm rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-24 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center mb-16 text-center">
              <span className="text-primary font-bold tracking-widest uppercase text-xs mb-4">Must Try</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold">Our Favorites</h2>
              <div className="w-20 h-1 bg-primary rounded-full mt-6" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} onQuickAdd={setSelectedProduct} />
              ))}
            </div>
            <div className="text-center mt-16">
              <Button variant="outline" size="lg" className="rounded-full px-10 border-primary/20 hover:bg-primary/5 group" asChild>
                <Link to="/menu">
                  See Full Menu <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <CustomizeModal product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
