import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Hash, UserCircle, ShieldCheck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    barangay: "",
    zipCode: "",
    completeAddress: "",
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        const profileData = data as any;
        setFormData({
          username: profileData.username || "",
          email: profileData.email || user.email || "",
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          phone: profileData.phone || "",
          city: profileData.city || "",
          barangay: profileData.barangay || "",
          zipCode: profileData.zip_code || "",
          completeAddress: profileData.complete_address || "",
        });
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        city: formData.city,
        barangay: formData.barangay,
        zip_code: formData.zipCode,
        complete_address: formData.completeAddress,
      } as any)
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated! ✨", description: "Your details have been saved successfully." });
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative overflow-hidden">
      {/* Decorative backgrounds */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-48 -mb-48" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center rotate-3">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-foreground/90">My Profile</h1>
            <p className="text-muted-foreground font-medium">Manage your personal information and address</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Account Overview Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-sm">
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-primary/5">
                  <div className="w-20 h-20 bg-primary/5 rounded-full mx-auto mb-3 flex items-center justify-center border-4 border-white shadow-soft">
                    <span className="text-2xl font-black text-primary/40">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground">@{formData.username}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{formData.email}</p>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground/80 px-2">
                  <ShieldCheck className="h-4 w-4 text-primary/60" />
                  <span>Verified Account</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-card border border-white/40 p-8 md:p-10">
              <form className="space-y-8">
                {/* Personal Info */}
                <section className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 flex items-center gap-2">
                    <User className="h-3 w-3" /> Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">First Name</Label>
                      <Input id="firstName" value={formData.firstName} onChange={handleInputChange} className="h-11 rounded-2xl border-primary/5 focus:border-primary/20 bg-white px-5 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Last Name</Label>
                      <Input id="lastName" value={formData.lastName} onChange={handleInputChange} className="h-11 rounded-2xl border-primary/5 focus:border-primary/20 bg-white px-5 shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input id="phone" value={formData.phone} onChange={handleInputChange} className="pl-12 h-11 rounded-2xl border-primary/5 focus:border-primary/20 bg-white shadow-sm" />
                    </div>
                  </div>
                </section>

                {/* Logistics */}
                <section className="space-y-6 pt-4 border-t border-primary/5">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Delivery Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">City / Municipality</Label>
                      <Input id="city" value={formData.city} readOnly className="h-11 rounded-2xl border-primary/5 bg-black/[0.02] px-5 text-muted-foreground/60 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barangay" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Barangay</Label>
                      <Input id="barangay" value={formData.barangay} readOnly className="h-11 rounded-2xl border-primary/5 bg-black/[0.02] px-5 text-muted-foreground/60 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="md:col-span-1 space-y-2">
                      <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Zip Code</Label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-primary/40" />
                        <Input id="zipCode" value={formData.zipCode} readOnly className="pl-10 h-11 rounded-2xl border-primary/5 bg-black/[0.02] text-muted-foreground/60 cursor-not-allowed" />
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label htmlFor="completeAddress" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Complete Address</Label>
                      <Input id="completeAddress" value={formData.completeAddress} onChange={handleInputChange} className="h-11 rounded-2xl border-primary/5 focus:border-primary/20 bg-white px-5 shadow-sm" />
                    </div>
                  </div>
                </section>

                <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-soft hover:scale-[1.01] active:scale-[0.99] transition-all mt-4" size="lg" onClick={handleSave} disabled={loading}>
                  {loading ? "Saving Changes..." : "Update Profile"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
