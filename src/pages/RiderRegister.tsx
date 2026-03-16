import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Lock,
  Bike,
  Key,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function RiderRegister() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    secretKey: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSendCode = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.secretKey) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before sending the code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          username: formData.username,
          rider_secret_key: formData.secretKey
        },
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);
    if (error) {
      toast({
        title: "Rider Registration Error",
        description: (
          <div className="space-y-2 text-xs text-left">
            <p>{error.message}</p>
            <p className="font-semibold text-primary italic">TIP: Use 123456 to bypass if email doesn't arrive.</p>
            <button
              type="button"
              onClick={() => setOtpSent(true)}
              className="px-3 py-1 bg-primary/10 text-primary rounded-md font-bold hover:bg-primary/20 transition-colors w-full"
            >
              [DEBUG] Skip to OTP (Use 123456)
            </button>
          </div>
        ),
        variant: "destructive"
      });
    } else {
      setOtpSent(true);
      toast({ title: "Rider Code Sent! 📧", description: "Check your email for verification." });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpSent) {
      handleSendCode();
      return;
    }

    if (otp.length < 6) {
      toast({ title: "Incomplete Code", description: "Please enter the full verification code.", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Development Bypass
    if (otp === "123456") {
      toast({ title: "Rider Dev Mode: Verified! 🛠️", description: "Bypassing email check." });
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
            rider_secret_key: formData.secretKey
          },
        },
      });
      setLoading(false);
      if (!signUpError) {
        await supabase.auth.signOut();
        toast({ title: "Rider Account Created", description: "Please log in with your new credentials." });
        navigate("/login");
      }
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      email: formData.email,
      token: otp,
      type: "signup",
    });

    setLoading(false);
    if (error) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    } else {
      await supabase.auth.signOut();
      toast({ title: "Rider Verified! 🎉", description: "Account created. Please log in to continue." });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-48 -mb-48" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-card border border-white/40 p-10 relative z-10">
        <Link to="/register" className="inline-flex items-center gap-2 text-xs font-bold text-primary/60 hover:text-primary transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Customer Sign Up
        </Link>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-6 shadow-inner">
            <Bike className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-black text-foreground/90">Join as Rider</h1>
          <p className="text-muted-foreground mt-2 font-medium">Register as a delivery partner</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Username</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              <Input id="username" placeholder="rider_sip" value={formData.username} onChange={handleInputChange} required className="pl-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Full Name</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              <Input id="fullName" placeholder="Delivery Partner" value={formData.fullName} onChange={handleInputChange} required className="pl-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Email Address</Label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="rider@miktea.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={otpSent}
                  className="pl-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50"
                />
              </div>
              {otpSent && (
                <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100 animate-in fade-in zoom-in">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Secure Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required minLength={6} className="pl-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="secretKey" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Rider Secret Key</Label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              <Input
                id="secretKey"
                type="password"
                placeholder="SIPS_RIDER_2024"
                value={formData.secretKey}
                onChange={handleInputChange}
                required
                className="pl-12 h-12 rounded-2xl border-primary/40 focus:border-primary focus-visible:ring-primary/20 bg-white shadow-sm"
              />
            </div>
          </div>

          {otpSent && (
            <div className="bg-primary/[0.03] rounded-3xl border border-dashed border-primary/20 p-6 space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-primary/60 mb-3">OTP Code</p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} className="w-10 h-12 rounded-xl border-primary/10 bg-white text-lg font-bold" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <button type="button" onClick={handleSendCode} className="text-[10px] text-primary font-bold hover:underline mt-4">
                  Resend Code
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-soft hover:scale-[1.01] active:scale-[0.99] transition-all bg-primary hover:bg-primary/90 mt-4" size="lg" disabled={loading}>
            {loading ? "Processing..." : (otpSent ? "Verify & Register" : "Get Registration Code")}
          </Button>
        </form>
      </div>
    </div>
  );
}
