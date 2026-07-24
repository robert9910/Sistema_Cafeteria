import { formatCurrency } from "@/lib/format";
import { SIGUIENTE_ESTADO, type OrderWithItems } from "@/lib/orders";

const ACCION_POR_ESTADO: Record<string, string> = {
  pendiente: "Empezar a preparar",
  preparando: "Marcar listo",
  listo: "Marcar entregado",
};

export function OrderCard({
  pedido,
  actualizando,
  onAvanzar,
}: {
  pedido: OrderWithItems;
  actualizando: boolean;
  onAvanzar: () => void;
}) {
  const siguiente = SIGUIENTE_ESTADO[pedido.estado];

  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium">Mesa {pedido.mesa}</span>
        <span className="text-sm text-neutral-500">{formatCurrency(pedido.total)}</span>
      </div>

      <ul className="mb-3 space-y-1 text-sm text-neutral-600">
        {pedido.order_items.map((item) => (
          <li key={item.id}>
            {item.cantidad}× {item.products.nombre}
          </li>
        ))}
      </ul>

      {siguiente && (
        <button
          type="button"
          onClick={onAvanzar}
          disabled={actualizando}
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {actualizando ? "Actualizando..." : ACCION_POR_ESTADO[pedido.estado]}
        </button>
      )}
    </div>
  );
}
