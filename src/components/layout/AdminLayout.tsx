import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, LogOut, BarChart3, Box, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview" },
  { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/admin/menu", icon: UtensilsCrossed, label: "Menu" },
  { to: "/admin/inventory", icon: Box, label: "Inventory" },
  { to: "/admin/customers", icon: Users, label: "Customers" },
  { to: "/admin/reports", icon: BarChart3, label: "Reports" },
  { to: "/admin/info", icon: ShieldCheck, label: "Admin Info" },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out successfully", description: "Returning to login page..." });
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-72 hidden lg:flex flex-col fixed h-[calc(100vh-2rem)] my-4 ml-4 z-40">
        <div className="glass h-full rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="mb-10 flex flex-col relative z-10">
            <Link to="/" className="group flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl filter drop-shadow-sm text-white">🧋</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold text-foreground leading-tight">
                  Sip <span className="text-primary italic">&</span> Tambay
                </span>
                <span className="text-[10px] uppercase font-black tracking-widest text-primary/60">Admin Portal</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1.5 relative z-10">
            {navItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${active
                      ? "bg-primary text-primary-foreground shadow-card scale-[1.02]"
                      : "text-foreground/60 hover:text-primary hover:bg-primary/5"
                    }`}
                >
                  <item.icon className={`h-5 w-5 ${active ? "text-primary-foreground" : "text-primary/40 group-hover:text-primary"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-primary/5 relative z-10">
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 px-6 py-6 rounded-2xl text-foreground/50 hover:text-destructive hover:bg-destructive/5 font-bold transition-all group"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-80 p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
