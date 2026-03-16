import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

export default function Navbar() {
  const { user, isAdmin, isRider, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <span className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">🧋</span>
          <span className="font-display text-2xl font-bold text-foreground tracking-tight">
            Sip <span className="text-primary italic">&</span> Tambay
          </span>
        </Link>
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/menu" className="font-body font-semibold text-foreground/70 hover:text-primary transition-all duration-300 relative group">
            Menu
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
          </Link>
          {user && (
            <Link to="/orders" className="font-body font-semibold text-foreground/70 hover:text-primary transition-all duration-300 relative group">
              My Orders
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          )}
          {isRider && (
            <Link to="/rider" className="font-body font-semibold text-primary hover:text-primary/80 transition-all duration-300 relative group flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Rider POV
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          )}
          <Link to="/contact" className="font-body font-semibold text-foreground/70 hover:text-primary transition-all duration-300 relative group">
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cart")} className="relative rounded-full hover:bg-primary/5 group">
            <ShoppingCart className="h-5 w-5 group-hover:text-primary transition-colors" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-soft">
                {itemCount}
              </span>
            )}
          </Button>
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5" onClick={() => navigate("/profile")}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/5 text-muted-foreground hover:text-destructive" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button variant="default" className="hidden md:flex rounded-full px-6 shadow-soft" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-b p-4 space-y-2 animate-fade-in">
          <Link to="/menu" onClick={() => setMobileOpen(false)} className="block p-2 font-display font-medium rounded-lg hover:bg-muted">Menu</Link>
          {user && <Link to="/orders" onClick={() => setMobileOpen(false)} className="block p-2 font-display font-medium rounded-lg hover:bg-muted">My Orders</Link>}
          {isRider && <Link to="/rider" onClick={() => setMobileOpen(false)} className="block p-2 font-display font-medium rounded-lg hover:bg-muted text-primary">Rider POV</Link>}
          <Link to="/contact" onClick={() => setMobileOpen(false)} className="block p-2 font-display font-medium rounded-lg hover:bg-muted">Contact</Link>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block p-2 font-display font-medium rounded-lg hover:bg-muted">Profile</Link>
              <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="block w-full text-left p-2 font-display font-medium rounded-lg hover:bg-muted text-destructive">Sign Out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block p-2 font-display font-medium text-primary rounded-lg hover:bg-muted">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
