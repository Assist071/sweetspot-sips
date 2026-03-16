import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-primary/20 text-foreground" },
  preparing: { label: "Preparing", className: "bg-[hsl(40,80%,60%)]/20 text-foreground" },
  out_for_delivery: { label: "Out for Delivery", className: "bg-blue-500/20 text-blue-700" },
  delivered: { label: "Delivered", className: "bg-success/20 text-foreground" },
  complete: { label: "Complete", className: "bg-success/20 text-foreground" },
  cancelled: { label: "Cancelled", className: "bg-destructive/20 text-destructive" },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-display font-semibold", config.className)}>
      {config.label}
    </span>
  );
}
