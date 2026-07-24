import { formatCurrency } from "@/lib/format";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import type { Order } from "@/types/database";

export function OrderTracker({
  mesa,
  pedidoInicial,
  onNuevoPedido,
}: {
  mesa: number;
  pedidoInicial: Order;
  onNuevoPedido: () => void;
}) {
  const estado = useRealtimeOrder(pedidoInicial.id, pedidoInicial.estado);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-neutral-500">Mesa {mesa} · Pedido enviado</p>
      <EstadoBadge estado={estado} />
      <p className="text-2xl font-semibold">{formatCurrency(pedidoInicial.total)}</p>
      <p className="text-sm text-neutral-500">
        {estado === "entregado"
          ? "¡Disfruta tu pedido!"
          : "Te avisaremos aquí cuando esté listo."}
      </p>

      {estado === "entregado" && (
        <button
          type="button"
          onClick={onNuevoPedido}
          className="mt-4 rounded-md border border-neutral-300 px-4 py-2 text-sm"
        >
          Hacer otro pedido
        </button>
      )}
    </main>
  );
}
