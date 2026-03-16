import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Lock, MapPin, Hash, UserCircle, SendHorizontal, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface CityData {
  zipCode: string;
  barangays: string[];
}

const LAGUNA_DATA: Record<string, CityData> = {
  "Alaminos": { zipCode: "4001", barangays: ["Poblacion I", "Poblacion II", "Poblacion III", "Poblacion IV", "San Agustin", "San Andres", "San Benito", "San Gregorio", "San Jose", "San Juan", "San Miguel", "San Roque", "Santa Rosa", "Palma"] },
  "Bay": { zipCode: "4033", barangays: ["Bitin", "Calo", "Dila", "Maitim", "Puypuy", "San Antonio", "San Isidro", "Santa Cruz", "Santo Domingo", "Tagapo"] },
  "Biñan City": { zipCode: "4024", barangays: ["Biñan (Poblacion)", "Bungahan", "Canlalay", "Casile", "De La Paz", "Ganado", "Langkiwa", "Loma", "Malaban", "Malamig", "Mamplas", "Platero", "San Antonio", "San Francisco (Halang)", "San Jose", "San Vicente", "Soro-soro", "Sto. Niño", "Sto. Tomas (Calabuso)", "Timbao", "Tubigan", "Zapote"] },
  "Cabuyao City": { zipCode: "4025", barangays: ["Baclaran", "Banay-Banay", "Banlic", "Bigaa", "Butong", "Casile", "Diezmo", "Gulod", "Mamatid", "Marinig", "Niugan", "Pittland", "Poblacion I", "Poblacion II", "Poblacion III", "Pulo", "Sala", "San Isidro"] },
  "Calamba City": { zipCode: "4027", barangays: ["Bagong Kalsada", "Bañadero", "Banlic", "Barandal", "Barangay 1 (Poblacion)", "Barangay 2 (Poblacion)", "Barangay 3 (Poblacion)", "Barangay 4 (Poblacion)", "Barangay 5 (Poblacion)", "Barangay 6 (Poblacion)", "Barangay 7 (Poblacion)", "Batino", "Bubuyan", "Bucal", "Bunggo", "Burol", "Camaligan", "Canlubang", "Halang", "Hornalan", "Kay-Anlog", "La Mesa", "Laguerta", "Lawas", "Lecheria", "Lingga", "Looc", "Mabato", "Majada Labas", "Makiling", "Mamatid", "Mapagong", "Masili", "Maunong", "Mayapa", "Milagrosa", "Paciano Rizal", "Palingon", "Palo-Alto", "Pansol", "Parian", "Prinza", "Punlak", "Putho Tuntungin", "Real", "Saimsim", "Sampiruhan", "San Cristobal", "San Jose", "San Juan", "Sirang Lupa", "Sucol", "Turbina", "Uwisan"] },
  "Calauan": { zipCode: "4012", barangays: ["Bangkuruhan", "Dayap", "Hanggan", "Imok", "Kanluran (Poblacion)", "Lamot 1", "Lamot 2", "Limao", "Mabacan", "Masiit", "Paliparan", "Perez", "Prinza", "San Isidro", "Santo Tomas", "Silangan (Poblacion)"] },
  "Los Baños": { zipCode: "4030", barangays: ["Anos", "Bagong Silang", "Bambang", "Batong Malake", "Bayog", "Lalakay", "Maahas", "Malinta", "Mayondon", "Putho Tuntungin", "San Antonio", "Tadlac", "Timugan", "Tuntungin-Putho"] },
  "San Pablo City": { zipCode: "4000", barangays: ["I-A (Poblacion)", "I-B (Poblacion)", "I-C (Poblacion)", "II-A (Poblacion)", "II-B (Poblacion)", "II-C (Poblacion)", "II-D (Poblacion)", "II-E (Poblacion)", "II-F (Poblacion)", "III-A (Poblacion)", "III-B (Poblacion)", "III-C (Poblacion)", "III-D (Poblacion)", "III-E (Poblacion)", "III-F (Poblacion)", "IV-A (Poblacion)", "IV-B (Poblacion)", "IV-C (Poblacion)", "V-A (Poblacion)", "V-B (Poblacion)", "V-C (Poblacion)", "VI-A (Poblacion)", "VI-B (Poblacion)", "VI-C (Poblacion)", "VI-D (Poblacion)", "VI-E (Poblacion)", "VII-A (Poblacion)", "VII-B (Poblacion)", "VII-C (Poblacion)", "VII-D (Poblacion)", "VII-E (Poblacion)", "Atisan", "Bautista", "Concepcion", "Dagatan", "Del Remedio", "San Antonio 1", "San Antonio 2", "San Bartolome", "San Buenaventura", "San Cristobal", "San Francisco", "San Gabriel", "San Gregorio", "San Ignacio", "San Isidro", "San Jose", "San Juan", "San Lucas 1", "San Lucas 2", "San Marcos", "San Mateo", "San Miguel", "San Nicolas", "San Pedro", "San Rafael", "San Roque", "San Vicente", "Santa Ana", "Santa Catalina", "Santa Cruz", "Santa Elena", "Santa Filomena", "Santa Maria", "Santa Maria Magdalena", "Santa Monica", "Santa Veronica", "Santiago 1", "Santiago 2", "Santisimo Rosario", "Soledad"] },
  "San Pedro City": { zipCode: "4023", barangays: ["Bagong Silang", "Chrysanthemum", "Cuyab", "Estrella", "G.S.I.S.", "Landayan", "Langgam", "Laram", "Magsaysay", "Maharlika", "Narra", "Nueva", "Pacita 1", "Pacita 2", "Poblacion", "Riverside", "Rosario", "Sampaguita", "San Antonio", "San Lorenzo South", "San Vicente", "Santo Niño", "United Bayanihan", "United Better Living"] },
  "Santa Cruz": { zipCode: "4009", barangays: ["Alipit", "Bagong Bayan", "Bubukal", "Calios", "Duhat", "Gatid", "Jasaan", "Labuin", "Malinao", "Oogong", "Pagsawitan", "Palasan", "Patimbao", "Poblacion I", "Poblacion II", "Poblacion III", "Poblacion IV", "Poblacion V", "San Jose", "San Juan", "San Pablo Norte", "San Pablo Sur", "Santisima Cruz", "Santo Angel Central", "Santo Angel Norte", "Santo Angel Sur"] },
  "Santa Rosa City": { zipCode: "4026", barangays: ["Aplaya", "Balibago", "Caingin", "Dila", "Dita", "Don Jose", "Ibaba", "Kanluran", "Labas", "Macabling", "Malitlit", "Market Area", "Pooc", "Pulong Santa Cruz", "Santo Domingo", "Sinalhan", "Tagapo", "Tatiao"] },
  "Victoria": { zipCode: "4011", barangays: ["Banca-banca", "Daniw", "Masapang", "Nanhaya (Poblacion)", "Pagalangan", "San Francisco", "San Felix", "San Roque", "San Benito"] },
  "Liliw": { zipCode: "4004", barangays: ["Poblacion", "Bungkol", "Cabuyew", "Calumpang", "Culian", "Dagatan", "Daniw"] },
  "Nagcarlan": { zipCode: "4002", barangays: ["Poblacion", "Abo", "Alibungbungan", "Alumbrado", "Balayong", "Banago"] },
  "Pila": { zipCode: "4010", barangays: ["Poblacion", "Aplaya", "Bagong Pook", "Batiaw", "Bulilan Sur", "Concepcion"] },
};

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    barangay: "",
    zipCode: "",
    completeAddress: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCityChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      city: value,
      barangay: "",
      zipCode: LAGUNA_DATA[value]?.zipCode || "",
    }));
  };

  const handleBarangayChange = (value: string) => {
    setFormData((prev) => ({ ...prev, barangay: value }));
  };

  const sortedCities = useMemo(() => Object.keys(LAGUNA_DATA).sort(), []);
  const currentBarangays = useMemo(() => {
    return formData.city ? LAGUNA_DATA[formData.city]?.barangays.sort() : [];
  }, [formData.city]);

  const handleSendCode = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Information missing",
        description: "Please enter your email and desired password first before sending the code.",
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
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          city: formData.city,
          barangay: formData.barangay,
          zip_code: formData.zipCode,
          complete_address: formData.completeAddress,
        },
      },
    });

    setLoading(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } else {
      setOtpSent(true);
      toast({ title: "Code sent! 📧", description: "Please check your email for the 6-digit verification code." });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords match fail", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    if (!otpSent) {
      handleSendCode();
      return;
    }

    if (otp.length !== 6) {
      toast({ title: "Invalid code", description: "Please enter the 6-digit code sent to your email.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: formData.email,
      token: otp,
      type: "signup",
    });

    setLoading(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account verified! 🎉", description: "Welcome to the family!" });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Decorative backgrounds */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-48 -mb-48" />

      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-card border border-white/40 p-8 md:p-12 relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <UserCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-black text-foreground/90">Join the Family</h1>
          <p className="text-muted-foreground mt-2 font-medium">Verify your email to start your boba journey</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Identity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Username</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                <Input id="username" placeholder="e.g. boba_lover" value={formData.username} onChange={handleInputChange} required className="pl-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50" />
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
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={otpSent}
                    className="pl-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50"
                  />
                </div>
                {!otpSent && (
                  <Button type="button" onClick={handleSendCode} variant="outline" className="h-12 rounded-2xl border-primary/10 hover:bg-primary/5 gap-2 px-4 shadow-sm">
                    <SendHorizontal className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider">Send Code</span>
                  </Button>
                )}
                {otpSent && (
                  <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100 animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OTP Section */}
          {otpSent && (
            <div className="bg-primary/[0.03] rounded-3xl border border-dashed border-primary/20 p-6 space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-primary/60 mb-3">Verification Code</p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} className="w-10 h-12 rounded-xl border-primary/10 bg-white focus:ring-primary/20 text-lg font-bold" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4">
                  Didn't receive the code? <button type="button" onClick={handleSendCode} className="text-primary font-bold hover:underline">Resend</button>
                </p>
              </div>
            </div>
          )}

          {/* Name Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">First Name</Label>
              <Input id="firstName" placeholder="John" value={formData.firstName} onChange={handleInputChange} required className="h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50 px-5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Last Name</Label>
              <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} required className="h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50 px-5" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              <Input id="phone" placeholder="09XX XXX XXXX" value={formData.phone} onChange={handleInputChange} required className="pl-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50" />
            </div>
          </div>

          {/* Address Section */}
          <div className="p-6 bg-primary/[0.03] rounded-3xl border border-primary/5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest text-primary">Delivery Address</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/40">City / Municipality</Label>
                <Select onValueChange={handleCityChange} required>
                  <SelectTrigger className="h-11 rounded-2xl border-primary/5 focus:border-primary/20 bg-white">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-primary/10 max-h-60">
                    {sortedCities.map((city) => (
                      <SelectItem key={city} value={city} className="rounded-xl">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barangay" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/40">Barangay</Label>
                <Select onValueChange={handleBarangayChange} required disabled={!formData.city}>
                  <SelectTrigger className="h-11 rounded-2xl border-primary/5 focus:border-primary/20 bg-white">
                    <SelectValue placeholder={formData.city ? "Select Barangay" : "Select City first"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-primary/10 max-h-60">
                    {currentBarangays.map((barangay) => (
                      <SelectItem key={barangay} value={barangay} className="rounded-xl">
                        {barangay}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/40">Zip Code</Label>
                <div className="relative text-muted-foreground/50">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3" />
                  <Input
                    id="zipCode"
                    placeholder="XXXX"
                    value={formData.zipCode}
                    readOnly
                    className="pl-10 h-11 rounded-2xl border-primary/5 bg-black/[0.02] cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="completeAddress" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/40">Complete Address</Label>
                <Input id="completeAddress" placeholder="House No., Street Name, etc." value={formData.completeAddress} onChange={handleInputChange} required className="h-11 rounded-2xl border-primary/5 focus:border-primary/20 bg-white px-5" />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Password</Label>
              <div className="relative group/pass">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within/pass:text-primary transition-colors" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required 
                  minLength={6} 
                  className="pl-12 pr-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Confirm Password</Label>
              <div className="relative group/conf">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within/conf:text-primary transition-colors" />
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={formData.confirmPassword} 
                  onChange={handleInputChange} 
                  required 
                  minLength={6} 
                  className="pl-12 pr-12 h-12 rounded-2xl border-primary/5 focus:border-primary/20 bg-white/50" 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-soft hover:scale-[1.01] active:scale-[0.99] transition-all" size="lg" disabled={loading}>
            {loading ? (otpSent ? "Verifying Token..." : "Sending Code...") : (otpSent ? "Verify & Sign Up" : "Send Verification Code")}
          </Button>
        </form>

        <p className="text-center mt-8 text-sm text-muted-foreground font-medium flex flex-col gap-2">
          <span>Already a member? <Link to="/login" className="text-primary font-bold hover:underline">Sign In here</Link></span>
          <span className="text-[10px] opacity-60">Want to deliver with us? <Link to="/rider/register" className="text-primary hover:underline font-bold italic">Join as a Rider</Link></span>
        </p>
      </div>
    </div>
  );
}
