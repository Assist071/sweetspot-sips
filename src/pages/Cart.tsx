import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Receipt, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-32 text-center"
      >
        <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <ShoppingBag className="h-16 w-16 text-primary/20" />
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-2 -right-2 text-6xl"
          >
            🧋
          </motion.span>
        </div>
        <h1 className="text-4xl font-display font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-10 max-w-sm mx-auto text-lg">
          Looks like you haven't added any drinks yet. Explore our delicious flavors!
        </p>
        <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-soft">
          <Link to="/menu">Explore Menu</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(244,163,143,0.15),transparent_50%)] bg-background">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <Button variant="ghost" size="sm" className="hover:bg-primary/10 rounded-full group px-5 h-10 border border-transparent hover:border-primary/10 transition-all" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold uppercase tracking-[0.2em] text-[10px]">Back to browsing</span>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-10">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-primary/20 pb-8 gap-4">
              <div>
                <h1 className="text-6xl font-display font-bold tracking-tight text-foreground/90">Your Selection</h1>
                <p className="text-muted-foreground mt-3 font-medium text-lg italic">The art of tea, curated just for you.</p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </header>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                    className="group bg-white/60 backdrop-blur-2xl rounded-[3rem] p-6 flex flex-col sm:flex-row items-center gap-8 border border-white shadow-soft hover:shadow-hover hover:border-primary/20 transition-all duration-700"
                  >
                    <div className="relative w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center text-4xl overflow-hidden shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform duration-700">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        "🧋"
                      )}
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem]" />
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h3 className="font-display text-2xl font-bold text-foreground/90 group-hover:text-primary transition-colors duration-500">{item.name}</h3>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 mt-2.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">
                        {item.size && (
                          <span className="bg-primary/10 px-2.5 py-1 rounded-lg text-primary/80 border border-primary/10">{item.size}</span>
                        )}
                        {item.flavor && (
                          <span className="bg-secondary/10 px-2.5 py-1 rounded-lg text-secondary/80 border border-secondary/10">{item.flavor}</span>
                        )}
                        {item.sugarLevel && (
                          <>
                            <span className="opacity-30">·</span>
                            <span>{item.sugarLevel} Sugar</span>
                          </>
                        )}
                        {item.iceLevel && (
                          <>
                            <span className="opacity-30">·</span>
                            <span>{item.iceLevel} Ice</span>
                          </>
                        )}
                        {item.toppings.length > 0 && (
                          <>
                            <span className="opacity-30">·</span>
                            <span className="text-secondary/80">{item.toppings.join(", ")}</span>
                          </>
                        )}
                      </div>
                      <p className="font-display font-black text-xl mt-5 text-foreground/80 tracking-tight">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center gap-4 sm:gap-6 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-primary/5">
                      <div className="flex items-center gap-1 p-1 bg-white/80 rounded-[1.5rem] border border-primary/10 shadow-sm mx-auto sm:mx-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-display font-black text-lg w-8 text-center tabular-nums">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 text-destructive/30 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all group/trash"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 transition-transform group-hover/trash:scale-110" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-white/70 backdrop-blur-3xl rounded-[3.5rem] p-10 border border-white shadow-hover lg:sticky lg:top-24"
            >
              <div className="flex items-center gap-4 mb-10 border-b border-primary/10 pb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold tracking-tight text-foreground/90">Summary</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none mt-1">Order Details</p>
                </div>
              </div>

              <div className="space-y-5 mb-10">
                <div className="flex justify-between items-center px-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">Subtotal</span>
                  <span className="font-display font-bold text-xl text-foreground/80">₱{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center px-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">Delivery</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-success/70 bg-success/5 px-3 py-1 rounded-full border border-success/10">Complimentary</span>
                </div>
                <div className="py-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent shadow-sm" />
                </div>
                <div className="flex justify-between items-center px-4">
                  <span className="font-display text-2xl font-black text-foreground/90">Grand Total</span>
                  <div className="text-right">
                    <span className="font-display text-4xl font-black text-primary drop-shadow-[0_2px_10px_rgba(244,163,143,0.3)]">
                      ₱{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  className="w-full h-16 rounded-[2rem] text-xl font-bold shadow-soft hover:shadow-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 group overflow-hidden relative"
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Confirm Order
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1.5" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-500"
                  onClick={clearCart}
                >
                  Empty Entire Bag
                </Button>
              </div>

              <div className="mt-12 p-5 bg-primary/5 rounded-[2rem] border border-primary/5">
                <p className="text-center text-[10px] text-muted-foreground/70 font-medium leading-relaxed italic">
                  "Every cup is a promise of quality, brewed and crafted for your ultimate satisfaction."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

