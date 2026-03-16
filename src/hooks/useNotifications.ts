import { supabase } from "@/integrations/supabase/client";

export const useNotifications = () => {
  const sendStatusNotification = async (userId: string, orderId: string, status: string) => {
    let message = "";
    switch (status) {
      case "preparing":
        message = "Your order is now being prepared! 🍵";
        break;
      case "out_for_delivery":
        message = "Your milk tea is on the way! 🛵";
        break;
      case "delivered":
        message = "Order delivered! Enjoy your Sip & Tambay. 🎉";
        break;
      default:
        return;
    }

    // Log to database (this could trigger a Supabase Edge Function to send SMS/Push)
    const { error } = await (supabase.from("notifications" as any).insert({
      user_id: userId,
      order_id: orderId,
      message,
      type: "status_update",
    }) as any);

    if (error) console.error("Notification Error:", error);
  };

  return { sendStatusNotification };
};
