"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { updateOrderStatus, SIGUIENTE_ESTADO, type OrderWithItems } from "@/lib/orders";
import type { OrderStatus } from "@/types/database";
import { OrderCard } from "@/components/barra/OrderCard";

const COLUMNAS: { estado: OrderStatus; titulo: string }[] = [
  { estado: "pendiente", titulo: "Pendientes" },
  { estado: "preparando", titulo: "Preparando" },
  { estado: "listo", titulo: "Listos" },
];

export function BarraClient({ pedidosIniciales }: { pedidosIniciales: OrderWithItems[] }) {
  const pedidos = useRealtimeOrders(pedidosIniciales);
  const [actualizando, setActualizando] = useState<string | null>(null);

  async function avanzarEstado(pedido: OrderWithItems) {
    const siguiente = SIGUIENTE_ESTADO[pedido.estado];
    if (!siguiente) return;

    setActualizando(pedido.id);
    try {
      await updateOrderStatus(createClient(), pedido.id, siguiente);
    } finally {
      setActualizando(null);
    }
  }

  return (
    <main className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
      {COLUMNAS.map((columna) => (
        <section key={columna.estado}>
          <h2 className="mb-3 font-medium text-neutral-600">
            {columna.titulo} ({pedidos.filter((p) => p.estado === columna.estado).length})
          </h2>
          <div className="space-y-3">
            {pedidos
              .filter((pedido) => pedido.estado === columna.estado)
              .map((pedido) => (
                <OrderCard
                  key={pedido.id}
                  pedido={pedido}
                  actualizando={actualizando === pedido.id}
                  onAvanzar={() => avanzarEstado(pedido)}
                />
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
