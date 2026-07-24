"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getActiveOrders, type OrderWithItems } from "@/lib/orders";

export function useRealtimeOrders(initialOrders: OrderWithItems[]) {
  const [orders, setOrders] = useState(initialOrders);
  const supabase = createClient();

  useEffect(() => {
    const refetch = async () => {
      try {
        setOrders(await getActiveOrders(supabase));
      } catch {
        // La próxima notificación realtime vuelve a intentar el refetch.
      }
    };

    const channel = supabase
      .channel("orders-barra")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, refetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return orders;
}
