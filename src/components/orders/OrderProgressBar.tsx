import { Check, Package, Truck, Home, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "preparing" | "out_for_delivery" | "delivered" | "complete" | "cancelled";

interface OrderProgressBarProps {
  status: OrderStatus;
}

const steps = [
  { id: "pending", label: "Pending", icon: Clock },
  { id: "preparing", label: "Preparing", icon: Package },
  { id: "out_for_delivery", label: "On the Way", icon: Truck },
  { id: "delivered", label: "Delivered", icon: Home },
];

export default function OrderProgressBar({ status }: OrderProgressBarProps) {
  if (status === "cancelled") {
    return (
      <div className="w-full p-4 bg-destructive/10 rounded-2xl border border-destructive/20 text-destructive text-center font-bold">
        This order was cancelled
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((step) => 
    step.id === status || (status === "complete" && step.id === "delivered")
  );

  return (
    <div className="w-full py-6">
      <div className="relative flex justify-between">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-10" />
        
        {/* Progress Line */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 -z-10"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || status === "complete";
          const isActive = index === currentStepIndex && status !== "complete";
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 group">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white",
                  isCompleted ? "border-primary bg-primary text-white" : 
                  isActive ? "border-primary text-primary shadow-soft scale-110" : 
                  "border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span 
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isCompleted || isActive ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
