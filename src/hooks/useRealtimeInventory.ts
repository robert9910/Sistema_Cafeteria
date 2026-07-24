"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getIngredients, getAlertasActivas, type AlertaConInsumo } from "@/lib/inventory";
import type { Ingredient } from "@/types/database";

export function useRealtimeInventory(initial: { ingredients: Ingredient[]; alertas: AlertaConInsumo[] }) {
  const [ingredients, setIngredients] = useState(initial.ingredients);
  const [alertas, setAlertas] = useState(initial.alertas);
  const supabase = createClient();

  useEffect(() => {
    const refetch = async () => {
      try {
        const [nuevosIngredientes, nuevasAlertas] = await Promise.all([
          getIngredients(supabase),
          getAlertasActivas(supabase),
        ]);
        setIngredients(nuevosIngredientes);
        setAlertas(nuevasAlertas);
      } catch {
        // La próxima notificación realtime vuelve a intentar el refetch.
      }
    };

    const channel = supabase
      .channel("inventario")
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_alerts" }, refetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ingredients, alertas };
}
