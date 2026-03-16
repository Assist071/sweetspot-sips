import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Coffee } from "lucide-react";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let loginEmail = identifier;

    // Check if input is a username instead of email
    if (!identifier.includes("@")) {
      const { data: resolvedEmail, error: lookupError } = await (supabase.rpc as any)("get_email_from_username", {
        p_username: identifier
      });

      if (lookupError || !resolvedEmail) {
        setLoading(false);
        toast({
          title: "Username not found",
          description: "We couldn't find an account with that username.",
          variant: "destructive"
        });
        return;
      }
      loginEmail = resolvedEmail as string;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    if (error) {
      setLoading(false);
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else if (data.user) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin"
      });

      setLoading(false);
      toast({ title: "Welcome back! 🧋" });
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-background relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-20 right-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-card border border-white/40 p-10 relative z-10 scale-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-6 group hover:rotate-0 transition-transform duration-500">
            <Coffee className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-black text-foreground/90 leading-tight">Welcome Back</h1>
          <p className="text-muted-foreground mt-2 font-medium">Ready for your boba fix?</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Email or Username</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              <Input
                id="identifier"
                placeholder="you@example.com or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="pl-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-primary/60">Password</Label>
              <Link to="/forgot-password" title="Forgot password?" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50 transition-all"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-soft hover:scale-[1.01] active:scale-[0.99] transition-all" size="lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center mt-8 text-sm text-muted-foreground font-medium">
          New here? <Link to="/register" className="text-primary font-bold hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}
