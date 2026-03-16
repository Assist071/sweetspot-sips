import { ReactNode } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MapPin, 
  History, 
  User, 
  LogOut,
  Bike,
  PackageCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RiderLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/rider" },
    { icon: MapPin, label: "Active Orders", path: "/rider/active" },
    { icon: History, label: "History", path: "/rider/history" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col md:flex-row font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-primary/5 p-8 h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-6 transition-transform">
            <Bike className="text-white h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl tracking-tight text-foreground">Sips Rider</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Delivery Partner</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group",
                location.pathname === item.path
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5", location.pathname === item.path ? "text-white" : "group-hover:text-primary")} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-8 border-t border-primary/5 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 h-14 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 px-5"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-bold text-sm tracking-tight">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen pb-24 md:pb-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-primary/5 px-8 flex items-center justify-between sticky top-0 z-40">
           <div className="flex items-center gap-3 md:hidden">
              <Bike className="h-6 w-6 text-primary" />
              <span className="font-display font-black text-lg">Sips Rider</span>
           </div>
           
           <div className="flex items-center gap-4 ml-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{user?.email}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-success">Online</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-primary/5 px-4 flex items-center justify-around z-50 rounded-t-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 transition-all duration-300",
              location.pathname === item.path ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", location.pathname === item.path ? "animate-bounce" : "")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
