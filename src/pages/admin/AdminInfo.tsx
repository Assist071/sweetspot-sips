import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Mail, User, Key, Calendar, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AdminInfo() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    }
    
    getProfile();
  }, [user]);

  // Fallback to metadata if profile not loaded yet
  const adminData = profile || user?.user_metadata || {};
  
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : "N/A";

  const infoItems = [
    { label: "Full Name", value: adminData.full_name || "N/A", icon: User },
    { label: "Username", value: adminData.username || "N/A", icon: Fingerprint },
    { label: "Email Address", value: user?.email || "N/A", icon: Mail },
    { label: "Account Type", value: "Administrator", icon: ShieldCheck, highlight: true },
    { label: "Registration Date", value: createdAt, icon: Calendar },
  ];

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col text-left">
        <h1 className="text-4xl font-display font-bold tracking-tight">Admin Profile</h1>
        <p className="text-muted-foreground mt-1">Your administrator account information and status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-card border border-white/40 flex flex-col items-center text-center relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
          
          <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 rotate-3 shadow-inner relative z-10">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          
          <h2 className="text-2xl font-display font-black text-foreground mb-1">
            {loading ? "Loading..." : (adminData.full_name || "Administrator")}
          </h2>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-6">System Access Verified</p>
          
          <div className="w-full pt-6 border-t border-primary/5 flex flex-col gap-3">
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-success capitalize">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Active
              </span>
            </div>
          </div>
        </motion.div>

        {/* Details Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-card border border-white/40 h-full">
            <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3">
              <Key className="h-5 w-5 text-primary" />
              Account Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {infoItems.map((item, i) => (
                <div key={item.label} className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">{item.label}</p>
                  <div className={`flex items-center gap-4 p-4 rounded-2xl border bg-white/50 transition-all hover:bg-white ${item.highlight ? 'border-primary/20 bg-primary/[0.02]' : 'border-primary/5'}`}>
                    <div className={`p-2 rounded-xl transition-colors ${item.highlight ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary/60'}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className={`text-sm font-bold truncate ${item.highlight ? 'text-primary' : 'text-foreground/80'}`}>
                      {loading ? "..." : item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-primary/[0.03] rounded-3xl border border-dashed border-primary/20 text-left">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground/90">Administrator Access</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    This account has full administrative privileges. You can manage products, view customer reports, and handle system configurations. Please ensure your credentials remain secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
