import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Message sent! 💌", description: "We'll get back to you soon." });
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold text-center mb-2">Get in Touch</h1>
      <p className="text-muted-foreground text-center mb-12">We'd love to hear from you</p>

      <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        {/* Info */}
        <div className="space-y-8">
          {[
            { icon: MapPin, title: "Visit Us", text: "123 Boba Street, Manila, Philippines" },
            { icon: Phone, title: "Call Us", text: "+63 912 345 6789" },
            { icon: Mail, title: "Email Us", text: "hello@bobabliss.com" },
            { icon: Clock, title: "Hours", text: "Mon–Sun: 10AM – 10PM" },
          ].map((info) => (
            <div key={info.title} className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <info.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold">{info.title}</h3>
                <p className="text-sm text-muted-foreground">{info.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" required className="rounded-xl" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required className="rounded-xl" />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" required className="rounded-xl" rows={5} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
