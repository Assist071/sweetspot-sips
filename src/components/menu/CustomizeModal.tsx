import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, CupSoda, Droplets, Sparkles, IceCream } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface CustomizeModalProps {
  product: Tables<"products"> | null;
  open: boolean;
  onClose: () => void;
}

export default function CustomizeModal({ product, open, onClose }: CustomizeModalProps) {
  const { addItem } = useCart();
  const [sugarLevel, setSugarLevel] = useState("");
  const [iceLevel, setIceLevel] = useState("");
  const [flavor, setFlavor] = useState("");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  const sugarLevels = product?.sugar_levels || [];
  const iceLevels = product?.ice_levels || [];
  const flavorOptions = (product as any)?.flavor_options || [];
  const toppings = Array.isArray(product?.toppings) ? (product.toppings as string[]) : [];
  const sizes = (product as any)?.sizes || [];

  // Reset and initialize states when product changes or modal opens
  useEffect(() => {
    if (product && open) {
      setQuantity(1);
      setSelectedToppings([]);
      
      const pSizes = (product as any).sizes || [];
      setSelectedSize(pSizes.length > 0 ? pSizes[0] : null);
      
      const pSugar = product.sugar_levels || [];
      setSugarLevel(pSugar.length > 0 ? pSugar[0] : "");
      
      const pIce = product.ice_levels || [];
      setIceLevel(pIce.length > 0 ? pIce[0] : "");

      const pFlavors = (product as any).flavor_options || [];
      setFlavor(pFlavors.length > 0 ? pFlavors[0] : "");
    }
  }, [product, open]);

  if (!product) return null;

  const handleAdd = () => {
    const finalUnitPrice = selectedSize 
      ? Number(product.price) + Number(selectedSize.price_adjustment || 0)
      : Number(product.price);

    addItem({
      productId: product.id,
      name: product.name,
      price: finalUnitPrice,
      quantity,
      sugarLevel: sugarLevel || undefined,
      iceLevel: iceLevel || undefined,
      flavor: flavor || undefined,
      size: selectedSize?.name,
      toppings: selectedToppings,
      imageUrl: product.image_url || undefined,
    });
    onClose();
  };

  const toggleTopping = (t: string) => {
    setSelectedToppings((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const unitPrice = selectedSize 
    ? Number(product.price) + Number(selectedSize.price_adjustment || 0)
    : Number(product.price);
  const currentPrice = unitPrice * quantity;

  // Determine available tabs
  const availableTabs = [
    { id: "size", label: "Size", icon: CupSoda, data: sizes },
    { id: "flavor", label: "Flavors", icon: Sparkles, data: flavorOptions },
    { id: "sugar", label: "Sugar", icon: Droplets, data: sugarLevels },
    { id: "ice", label: "Ice", icon: IceCream, data: iceLevels },
    { id: "extras", label: "Extras", icon: Plus, data: toppings },
  ].filter(tab => tab.data && tab.data.length > 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] bg-white/95 backdrop-blur-xl border-white/40 shadow-card p-6 overflow-hidden">
        <DialogHeader className="pb-4 border-b border-primary/5">
          <DialogTitle className="font-display text-2xl font-black text-primary/80 uppercase tracking-tighter">
            Customize Drink
          </DialogTitle>
          <p className="text-sm font-bold text-muted-foreground/60">{product.name}</p>
        </DialogHeader>

        <div className="mt-6">
          <Tabs defaultValue={availableTabs[0]?.id || "size"} className="w-full">
            <TabsList 
              className="grid w-full mb-6 rounded-2xl bg-primary/5 p-1 h-12"
              style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}
            >
              {availableTabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className="rounded-xl text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <tab.icon className="h-3.5 w-3.5 mb-0.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="min-h-[160px]">
              {/* Cup Size Content */}
              {availableTabs.some(t => t.id === "size") && (
                <TabsContent value="size" className="mt-0 focus-visible:outline-none animate-in fade-in-50 duration-300">
                  <div className="space-y-4">
                    <p className="font-display font-semibold text-[10px] uppercase tracking-widest text-primary/40 text-center">Select your cup size</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {sizes.map((s: any) => (
                        <Button
                          key={s.name}
                          variant={selectedSize?.name === s.name ? "default" : "outline"}
                          onClick={() => setSelectedSize(s)}
                          className="rounded-2xl px-6 h-14 font-bold transition-all shadow-sm border-primary/10"
                        >
                          {s.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Sugar Level Content */}
              {availableTabs.some(t => t.id === "sugar") && (
                <TabsContent value="sugar" className="mt-0 focus-visible:outline-none animate-in fade-in-50 duration-300">
                  <div className="space-y-4">
                    <p className="font-display font-semibold text-[10px] uppercase tracking-widest text-primary/40 text-center">Sweetness level</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {sugarLevels.map((s) => (
                        <Button 
                          key={s} 
                          variant={sugarLevel === s ? "default" : "outline"} 
                          onClick={() => setSugarLevel(s)} 
                          className="rounded-2xl h-12 w-16 font-bold transition-all shadow-sm border-primary/10"
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Flavors Content (Single Select) */}
              {availableTabs.some(t => t.id === "flavor") && (
                <TabsContent value="flavor" className="mt-0 focus-visible:outline-none animate-in fade-in-50 duration-300">
                  <div className="space-y-4">
                    <p className="font-display font-semibold text-[10px] uppercase tracking-widest text-primary/40 text-center">Choose your flavor</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {flavorOptions.map((f: string) => (
                        <Button 
                          key={f} 
                          variant={flavor === f ? "default" : "outline"} 
                          onClick={() => setFlavor(f)} 
                          className="rounded-2xl h-11 px-6 font-bold transition-all shadow-sm border-primary/10"
                        >
                          {f}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Extras/Toppings Content (Multi Select) */}
              {availableTabs.some(t => t.id === "extras") && (
                <TabsContent value="extras" className="mt-0 focus-visible:outline-none animate-in fade-in-50 duration-300">
                  <div className="space-y-4">
                    <p className="font-display font-semibold text-[10px] uppercase tracking-widest text-primary/40 text-center">Add some extra magic</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {toppings.map((t) => (
                        <Button 
                          key={t} 
                          variant={selectedToppings.includes(t) ? "default" : "outline"} 
                          onClick={() => toggleTopping(t)} 
                          className="rounded-2xl h-11 px-6 font-bold transition-all shadow-sm border-primary/10"
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Ice Level Content */}
              {availableTabs.some(t => t.id === "ice") && (
                <TabsContent value="ice" className="mt-0 focus-visible:outline-none animate-in fade-in-50 duration-300">
                  <div className="space-y-4">
                    <p className="font-display font-semibold text-[10px] uppercase tracking-widest text-primary/40 text-center">Temperature preference</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {iceLevels.map((i) => (
                        <Button 
                          key={i} 
                          variant={iceLevel === i ? "default" : "outline"} 
                          onClick={() => setIceLevel(i)} 
                          className="rounded-2xl h-11 px-5 font-bold transition-all shadow-sm border-primary/10"
                        >
                          {i}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>

          {/* Quantity & Footer */}
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-[1.5rem] border border-primary/5">
              <p className="font-display font-black text-xs uppercase tracking-widest text-primary/60">Quantity</p>
              <div className="flex items-center gap-6">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm transition-all" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-display font-black text-xl w-6 text-center">{quantity}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm transition-all" 
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button className="w-full h-16 rounded-[2rem] text-lg font-bold shadow-soft hover:scale-[1.01] active:scale-[0.99] transition-all bg-primary hover:bg-primary/90" size="lg" onClick={handleAdd}>
              Add to Cart — ₱{currentPrice.toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
